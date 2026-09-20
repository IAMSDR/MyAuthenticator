<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import { toast } from "~/utils/toast";
import { set } from "idb-keyval";
import { startAuthentication } from "@simplewebauthn/browser";
import { isNetworkError, offlineMessage, onlineNow } from "~/utils/offline";
import { normalizePrfExtension, getPrfResultBytes } from "~/utils/webauthn";
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
    toast.error("Passkey login requires an internet connection. Use password offline.");
    return;
  }
  loading.value = true;
  const id = toast.loading("Authenticating...");
  try {
    const { requestOptions, attemptId } = await $fetch<{ requestOptions: any; attemptId: string }>("/api/webauthn/authenticate", {
      method: "POST",
      body: {
        verify: false,
      },
    });

    const assertionResponse = await startAuthentication({
      optionsJSON: normalizePrfExtension(requestOptions),
    });

    const credentialId = assertionResponse.id;
    const prfBytes = getPrfResultBytes(assertionResponse.clientExtensionResults);

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

    let wrappedData: { wrappedDEK: string };
    try {
      wrappedData = await $fetch(`/api/webauthn/wrap?credentialId=${encodeURIComponent(credentialId)}`);
    } catch {
      // No DEK wrapper (PRF-less passkey) → logout to avoid half-authenticated state
      if (onlineNow()) await $fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      toast.error("Passkey authenticated, but cannot unlock vault. Enter password to unlock.", { id });
      return;
    }

    if (!prfBytes) {
      if (onlineNow()) await $fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      toast.error("Authenticator did not return PRF secret. Enter password to unlock vault.", { id });
      return;
    }

    const prfKey = await importKeyFromBytes(prfBytes);
    const b64DEK = await decryptWithKey(wrappedData.wrappedDEK, prfKey);
    const dek = await importKeyFromBase64(b64DEK);
    setDEK(dek);
    await set(`wrappedDEK:prf:${credentialId}`, wrappedData.wrappedDEK);
    setOfflineState(false);
    await refreshSession();
    toast.success("Passkey login successful", { id });
    await navigateTo("/");
  } catch (e: any) {
    toast.error(e?.data?.message ?? (e instanceof Error ? e.message : String(e)), { id });
  } finally {
    loading.value = false;
  }
};

const onSubmit = async (event: FormSubmitEvent<Login>) => {
  loading.value = true;
  const toastid = toast.loading("Verifying...");
  try {
    // Offline unlock: no network wait
    if (!onlineNow()) {
      const ok = await unlockWithPassword(event.data.password);
      if (ok) {
        setOfflineState(true);
        toast.success("Unlocked offline", { id: toastid });
        await navigateTo("/");
        return;
      }
      toast.error("Incorrect password or no cached vault data.", { id: toastid });
      return;
    }

    let res: { wrappedDEK: string; message: string };
    try {
      res = await $fetch<{ wrappedDEK: string; message: string }>("/api/auth/login", {
        method: "POST",
        body: event.data,
      });
    } catch (fetchErr: unknown) {
      if (isNetworkError(fetchErr)) {
        const ok = await unlockWithPassword(event.data.password);
        if (ok) {
          setOfflineState(true);
          toast.success("Unlocked offline", { id: toastid });
          await navigateTo("/");
          return;
        }
        toast.error(offlineMessage("log in"), { id: toastid });
        return;
      }
      throw fetchErr;
    }

    const b64DEK = await decryptWithPassword(res.wrappedDEK, event.data.password);
    const dek = await importKeyFromBase64(b64DEK);
    setDEK(dek);
    try {
      await set("wrappedDEK:password", res.wrappedDEK);
    } catch { void 0; }
    setOfflineState(false);
    await refreshSession();
    toast.success(res.message, { id: toastid });
    await navigateTo("/");
  } catch (e: any) {
    toast.error(
      e?.data?.message ?? (e instanceof Error ? e.message : String(e)),
      { id: toastid },
    );
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
    <BackgroundGlow />

    <div class="w-full max-w-sm">
      <div class="mb-6 text-center">
        <h1 class="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Unlock your vault
        </h1>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Enter your password to decrypt authenticators
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
