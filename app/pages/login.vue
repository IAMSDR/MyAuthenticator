<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import { toast } from "@steveyuowo/vue-hot-toast";
import { set } from "idb-keyval";
import { startAuthentication } from "@simplewebauthn/browser";
import { isNetworkError, offlineMessage, onlineNow } from "~/utils/offline";
import BackgroundGlow from "~/components/BackgroundGlow.vue";

const { fetch: refreshSession } = useUserSession();
const { setDEK, unlockWithPassword } = useEncryption();
const { setOfflineState } = useOffline();

const state = reactive({
  password: "",
});

const loading = ref(false);
const show = ref(false);

const loginWithPasskey = async () => {
  if (!onlineNow()) {
    toast.error("Passkey login requires an internet connection. Use master password offline.");
    return;
  }
  loading.value = true;
  const id = toast.loading("Authenticating...");
  try {
    // 1. Get request options from server (includes PRF eval extension)
    const { requestOptions, attemptId } = await $fetch<{ requestOptions: any; attemptId: string }>("/api/webauthn/authenticate", {
      method: "POST",
      body: {
        verify: false,
      },
    });

    // 2. Perform WebAuthn authentication via @simplewebauthn/browser
    const assertionResponse = await startAuthentication({
      optionsJSON: requestOptions,
    });

    const credentialId = assertionResponse.id;
    const prfResult = assertionResponse.clientExtensionResults?.prf?.results?.first;

    // 3. Verify assertion on server
    const verificationResponse = await $fetch<{ verified: boolean }>("/api/webauthn/authenticate", {
      method: "POST",
      body: {
        attemptId,
        response: assertionResponse,
        verify: true,
      },
    });

    if (!verificationResponse?.verified) {
      throw new Error("Authentication verification failed");
    }

    // 4. Fetch DEK wrapper for this passkey
    let wrappedData: { wrappedDEK: string };
    try {
      wrappedData = await $fetch(`/api/webauthn/wrap?credentialId=${encodeURIComponent(credentialId)}`);
    } catch (e: any) {
      // Passkey exists for authentication, but has no DEK wrapper (registered without PRF)
      // Logout session so user is not stuck in half-authenticated state without DEK
      if (onlineNow()) await $fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      toast.update(id, {
        message: "Passkey authenticated, but cannot unlock vault. Enter master password to unlock.",
        type: "error",
      });
      return;
    }

    if (!prfResult) {
      if (onlineNow()) await $fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      toast.update(id, {
        message: "Authenticator did not return PRF secret. Enter master password to unlock vault.",
        type: "error",
      });
      return;
    }

    const prfBytes = new Uint8Array(prfResult);
    const prfKey = await importKeyFromBytes(prfBytes);
    const b64DEK = await decryptWithKey(wrappedData.wrappedDEK, prfKey);
    const dek = await importKeyFromBase64(b64DEK);
    setDEK(dek);
    await set(`wrappedDEK:prf:${credentialId}`, wrappedData.wrappedDEK);
    setOfflineState(false);
    await refreshSession();
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
    // Instant offline unlock without waiting for network timeout
    if (!onlineNow()) {
      const ok = await unlockWithPassword(event.data.password);
      if (ok) {
        setOfflineState(true);
        toast.update(toastid, { message: "Unlocked offline", type: "success" });
        await navigateTo("/");
        return;
      }
      toast.update(toastid, { message: "Incorrect password or no cached vault data.", type: "error" });
      return;
    }

    const res = await $fetch<{ wrappedDEK: string; message: string }>("/api/auth/login", {
      method: "POST",
      body: event.data,
    });
    const b64DEK = await decryptWithPassword(res.wrappedDEK, event.data.password);
    const dek = await importKeyFromBase64(b64DEK);
    setDEK(dek);
    await set("wrappedDEK:password", res.wrappedDEK);
    setOfflineState(false);
    await refreshSession();
    toast.update(toastid, {
      message: res.message,
      type: "success",
    });
    await navigateTo("/");
  } catch (e: any) {
    // Only fallback to cached vault on true network failures, not on 4xx server rejections (wrong password)
    if (isNetworkError(e)) {
      const ok = await unlockWithPassword(event.data.password);
      if (ok) {
        setOfflineState(true);
        toast.update(toastid, { message: "Unlocked offline", type: "success" });
        await navigateTo("/");
        return;
      }
      toast.update(toastid, {
        message: offlineMessage("log in"),
        type: "error",
      });
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
