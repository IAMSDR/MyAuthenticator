<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import { toast } from "@steveyuowo/vue-hot-toast";
import { set } from "idb-keyval";
import { onlineNow } from "~/utils/offline";
import BackgroundGlow from "~/components/BackgroundGlow.vue";

const { fetch: refreshSession } = useUserSession();
const { authenticate } = useWebAuthn();
const { setDEK, unlockWithPassword, unlockWithPrf } = useEncryption();
const { setOfflineState } = useOffline();

const state = reactive({
  password: "",
});

const loading = ref(false);
const show = ref(false);

const loginWithPasskey = async () => {
  loading.value = true;
  const id = toast.loading("Authenticating...");
  try {
    const result = (await authenticate()) as any;
    const prfResult = result?.clientExtensionResults?.prf?.results?.first;
    if (!onlineNow() && prfResult) {
      const cid = result?.id ?? result?.credentialId;
      const ok = await unlockWithPrf(new Uint8Array(prfResult), cid);
      if (ok) {
        setOfflineState(true);
        toast.update(id, { message: "Offline mode", type: "success" });
        await navigateTo("/");
        return;
      }
      toast.update(id, { message: "Offline unlock unavailable. Use password.", type: "error" });
      return;
    }
    await refreshSession();
    let credentialId = result?.id ?? result?.credentialId;
    if (!credentialId) {
      try {
        const list = await $fetch<Array<{ id: string }>>("/api/webauthn/passkeys");
        credentialId = list[0]?.id;
      } catch {}
    }
    if (!credentialId) throw new Error("Passkey credential not found");
    let wrappedData: { wrappedDEK: string };
    try {
      wrappedData = await $fetch(`/api/webauthn/wrap?credentialId=${encodeURIComponent(credentialId)}`);
    } catch (e: any) {
      toast.update(id, { message: e?.data?.message ?? String(e), type: "error" });
      return;
    }
    let prfBytes: Uint8Array | null = prfResult ? new Uint8Array(prfResult) : null;
    if (!prfBytes) {
      try {
        const { prfSalt } = await $fetch<{ prfSalt: string }>("/api/auth/prf-salt");
        const b64 = prfSalt.replace(/-/g, "+").replace(/_/g, "/");
        prfBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).slice(0, 32);
      } catch {}
    }
    if (!prfBytes) throw new Error("PRF not available");
    const prfKey = await importKeyFromBytes(prfBytes);
    const b64DEK = await decryptWithKey(wrappedData.wrappedDEK, prfKey);
    const dek = await importKeyFromBase64(b64DEK);
    setDEK(dek);
    await set(`wrappedDEK:prf:${credentialId}`, wrappedData.wrappedDEK);
    toast.update(id, { message: "Passkey login successful", type: "success" });
    await navigateTo("/");
  } catch (e: any) {
    toast.update(id, { message: e?.data?.message ?? String(e), type: "error" });
  } finally {
    loading.value = false;
  }
};

const onSubmit = async (event: FormSubmitEvent<Login>) => {
  loading.value = true;
  const toastid = toast.loading("Verifying...");
  try {
    const res = await $fetch<{ wrappedDEK: string; message: string }>("/api/auth/login", {
      method: "POST",
      body: event.data,
    });
    const b64DEK = await decryptWithPassword(res.wrappedDEK, event.data.password);
    const dek = await importKeyFromBase64(b64DEK);
    setDEK(dek);
    await set("wrappedDEK:password", res.wrappedDEK);
    await refreshSession();
    toast.update(toastid, {
      message: res.message,
      type: "success",
    });
    await navigateTo("/");
  } catch (e: any) {
    if (!onlineNow()) {
      const ok = await unlockWithPassword(event.data.password);
      if (ok) {
        setOfflineState(true);
        toast.update(toastid, { message: "Offline mode", type: "success" });
        await navigateTo("/");
        return;
      }
      toast.update(toastid, { message: "Offline and no cached unlock.", type: "error" });
      return;
    }
    toast.update(toastid, {
      message: e?.data?.message ?? String(e),
      type: "error",
    });
  } finally {
    loading.value = false;
  }
};

async function onError(event: FormErrorEvent) {
  toast.error(event.errors[0]?.message ?? "Validation failed");
}
</script>

<template>
  <div class="relative min-h-screen flex items-center justify-center p-4">
    <!-- Interactive Cursor Glow active on Auth Pages -->
    <BackgroundGlow />

    <div class="w-full max-w-sm">
      <div class="mb-6 text-center">
        <h1 class="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Unlock your vault
        </h1>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Enter your master password to decrypt authenticators
        </p>
      </div>

      <UCard>
        <UForm
          :schema="loginSchema"
          :state="state"
          class="space-y-4"
          @submit="onSubmit"
          @error="onError"
        >
          <UFormField label="Password" required>
            <UInput
              v-model="state.password"
              :type="show ? 'text' : 'password'"
              placeholder="Enter your password"
              size="md"
              required
              :ui="{ base: 'h-10' }"
            >
              <template #trailing>
                <UButton
                  :icon="show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  tabindex="-1"
                  @click="show = !show"
                />
              </template>
            </UInput>
          </UFormField>

          <UButton
            type="submit"
            block
            size="md"
            class="h-10 mt-2 cursor-pointer"
            :loading="loading"
            :disabled="loading"
          >
            Unlock vault
          </UButton>

          <USeparator label="or" color="neutral" size="sm" :ui="{ root: 'my-3' }" />

          <UButton
            icon="i-lucide-fingerprint"
            variant="soft"
            color="primary"
            block
            size="md"
            class="h-10 cursor-pointer"
            :disabled="loading"
            @click="loginWithPasskey"
          >
            Login with Passkey
          </UButton>
        </UForm>
      </UCard>
    </div>
  </div>
</template>
