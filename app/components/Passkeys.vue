<script setup lang="ts">
import AdaptiveModal from "./AdaptiveModal.vue";
import { h } from "vue";
import type { TableColumn } from "@nuxt/ui";
import { toast } from "@steveyuowo/vue-hot-toast";
import { startRegistration } from "@simplewebauthn/browser";

const UButton = resolveComponent("UButton");

const { data: passkeys, status } = await useLazyFetch(
  "/api/webauthn/passkeys",
  {
    key: "passkeys",
    server: false,
  }
);

const columns: TableColumn<Passkey>[] = [
  { header: "Device / Name", accessorKey: "displayName" },
  {
    header: "Created",
    accessorKey: "createdAt",
    cell: ({ row }) => {
      const d = (row.original as any).createdAt;
      return d ? new Date(d).toLocaleDateString() : "-";
    },
  },
  {
    id: "actions",
    cell: ({ row }) =>
      h(UButton, {
        color: "error",
        variant: "ghost",
        size: "xs",
        icon: "i-lucide-trash-2",
        disabled: loading.value,
        onClick: () => deletePasskey(row.original.id),
      }),
  },
];

const passKeyName = ref<string>("");

const loading = ref(false);

const addPasskey = async () => {
  if (!passKeyName.value.trim()) {
    toast.error("Enter a device name");
    return;
  }
  loading.value = true;
  let createdCredId: string | null = null;
  try {
    const user = {
      userName: `${passKeyName.value} - MyAuthenticator`,
      displayName: passKeyName.value,
    };

    // 1. Get creation options from server (includes PRF extension)
    const { creationOptions, attemptId } = await $fetch<{ creationOptions: any; attemptId: string }>("/api/webauthn/register", {
      method: "POST",
      body: {
        user,
        verify: false,
      },
    });

    // 2. Perform WebAuthn ceremony directly with @simplewebauthn/browser to receive full clientExtensionResults
    const attestationResponse = await startRegistration({
      optionsJSON: creationOptions,
    });

    createdCredId = attestationResponse.id;

    // 3. Verify on server and save credential in Redis Hash
    const verificationResponse = await $fetch<{ verified: boolean }>("/api/webauthn/register", {
      method: "POST",
      body: {
        user,
        attemptId,
        response: attestationResponse,
        verify: true,
      },
    });

    if (!verificationResponse?.verified) {
      throw new Error("Registration verification failed");
    }

    const { dek } = useEncryption();
    const prfResult = attestationResponse.clientExtensionResults?.prf?.results?.first;

    if (prfResult && dek.value && createdCredId) {
      // Authenticator supports PRF: generate and store DEK wrapper
      const prfBytes = new Uint8Array(prfResult);
      const prfKey = await importKeyFromBytes(prfBytes);
      const b64DEK = await exportKeyToBase64(dek.value);
      const wrapped = await encryptWithKey(b64DEK, prfKey);
      await $fetch("/api/webauthn/wrap", {
        method: "POST",
        body: { credentialId: createdCredId, wrappedDEK: wrapped },
      });
      toast.success("Passkey registered with vault unlock support");
    } else {
      // PRF is unsupported on this authenticator/platform
      toast.success("Passkey registered (Auth only – use password to unlock vault)");
    }

    passKeyName.value = "";
    await refreshNuxtData("passkeys");
  } catch (err: any) {
    // If registration succeeded on server but wrapping failed, cleanup credential
    if (createdCredId) {
      try {
        await $fetch("/api/webauthn/passkeys", {
          method: "DELETE",
          query: { id: createdCredId },
        });
      } catch {}
    }
    toast.error(err?.data?.message ?? String(err));
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const deletePasskey = async (id: string) => {
  const isSure = confirm(
    "Delete this passkey? You won't be able to use it to log in again."
  );
  if (!isSure) return;
  const toastid = toast.loading("Deleting...");
  $fetch("/api/webauthn/passkeys", {
    method: "DELETE",
    query: { id: id },
  })
    .then(async (res) => {
      toast.update(toastid, {
        message: (res as any).message,
        type: "success",
      });
      await refreshNuxtData("passkeys");
    })
    .catch((err) => {
      console.error(err);
      toast.update(toastid, {
        message: err?.data?.message ?? String(err),
        type: "error",
      });
    });
};
</script>

<template>
  <AdaptiveModal
    title="Passkeys"
    description="Manage biometric credentials and hardware keys"
  >
    <template #body>
      <div class="space-y-4">
        <form class="flex gap-2" @submit.prevent="addPasskey">
          <UInput
            v-model="passKeyName"
            placeholder="e.g. MacBook TouchID, YubiKey"
            size="md"
            required
            class="flex-1"
            :ui="{ base: 'h-10' }"
          />
          <UButton
            type="submit"
            icon="i-lucide-plus"
            size="md"
            :loading="loading"
            :disabled="loading"
            class="h-10 cursor-pointer px-4"
            >Add</UButton
          >
        </form>

        <UTable
          :columns="columns"
          :loading="status === 'pending'"
          :data="passkeys"
          class="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden flex-1 text-xs"
        />
      </div>
    </template>
  </AdaptiveModal>
</template>


