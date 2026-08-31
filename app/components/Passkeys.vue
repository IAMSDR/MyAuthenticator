<script setup lang="ts">
import AdaptiveModal from "./AdaptiveModal.vue";
import { h } from "vue";
import type { TableColumn } from "@nuxt/ui";
import { toast } from "@steveyuowo/vue-hot-toast";

const UButton = resolveComponent("UButton");

const { register } = useWebAuthn();

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
        icon: "i-heroicons-trash-16-solid",
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
  try {
    const cred = (await register({
      userName: `${passKeyName.value} - MyAuthenticator`,
      displayName: passKeyName.value,
    })) as any;

    const { dek } = useEncryption();
    if (dek.value) {
      try {
        const { prfSalt } = await $fetch<{ prfSalt: string }>("/api/auth/prf-salt");
        let prfBytes: Uint8Array | null = null;
        const prfResult = (cred as any)?.clientExtensionResults?.prf?.results?.first;
        if (prfResult) prfBytes = new Uint8Array(prfResult);
        if (!prfBytes) {
          const b64 = prfSalt.replace(/-/g, "+").replace(/_/g, "/");
          prfBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).slice(0, 32);
        }
        if (prfBytes) {
          const prfKey = await importKeyFromBytes(prfBytes);
          const b64DEK = await exportKeyToBase64(dek.value);
          const wrapped = await encryptWithKey(b64DEK, prfKey);
          let cid = (cred as any)?.id ?? (cred as any)?.credentialId ?? "";
          if (!cid) {
            const list = await $fetch<Array<{ id: string }>>("/api/webauthn/passkeys");
            cid = list[list.length - 1]?.id ?? "";
          }
          if (cid) {
            await $fetch("/api/webauthn/wrap", {
              method: "POST",
              body: { credentialId: cid, wrappedDEK: wrapped },
            });
          }
        }
      } catch (e) {
        console.warn(e);
      }
    }
    toast.success("Passkey added successfully");
    passKeyName.value = "";
    await refreshNuxtData("passkeys");
  } catch (err: any) {
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
            icon="i-heroicons-plus-16-solid"
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


