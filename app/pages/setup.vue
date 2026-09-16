<script setup lang="ts">
import { toast } from "@steveyuowo/vue-hot-toast";
import { set } from "idb-keyval";
import BackgroundGlow from "~/components/BackgroundGlow.vue";
import AdaptiveModal from "~/components/AdaptiveModal.vue";
import { ensureOnline, getWriteErrorMessage } from "~/utils/offline";

const { fetch: refreshSession } = useUserSession();
const { setDEK } = useEncryption();

const password = ref("");
const confirm = ref("");
const loading = ref(false);
const show = ref(false);

const showConfirmModal = ref(false);
const confirmText = ref("");

const requirements = computed(() => [
  { key: "length", text: "At least 8 characters", met: password.value.length >= 8 },
  { key: "upper", text: "At least one uppercase letter (A-Z)", met: /[A-Z]/.test(password.value) },
  { key: "lower", text: "At least one lowercase letter (a-z)", met: /[a-z]/.test(password.value) },
  { key: "number", text: "At least one number (0-9)", met: /[0-9]/.test(password.value) },
  { key: "symbol", text: "At least one symbol (!@#$%^&*-)", met: /[#?!@$%^&*-]/.test(password.value) },
]);

const allRequirementsMet = computed(() => requirements.value.every((r) => r.met));
const passwordsMatch = computed(() => !!confirm.value && password.value === confirm.value);

const handleCreateClick = () => {
  if (!password.value || !confirm.value) {
    toast.error("Please fill in all fields");
    return;
  }
  if (!allRequirementsMet.value) {
    toast.error("Password does not meet all requirements");
    return;
  }
  if (password.value !== confirm.value) {
    toast.error("Passwords do not match");
    return;
  }
  const parsed = passwordSchema.safeParse({ password: password.value });
  if (!parsed.success) {
    toast.error(parsed.error.issues[0]?.message ?? "Invalid password");
    return;
  }
  confirmText.value = "";
  showConfirmModal.value = true;
};

const onConfirm = async () => {
  if (confirmText.value.trim().toLowerCase() !== "i confirm") {
    toast.error('Please type "I confirm"');
    return;
  }
  if (!ensureOnline("create account")) return;
  loading.value = true;
  const id = toast.loading("Creating account...");
  try {
    const { b64, key } = await generateDEK();
    const wrappedDEK = await encryptWithPassword(b64, password.value);
    await $fetch("/api/auth/setup", { method: "POST", body: { password: password.value, wrappedDEK } });
    const setupComplete = useState<boolean | null>("setupComplete", () => null);
    setupComplete.value = true;
    await refreshSession();
    setDEK(key);
    try {
      await set("wrappedDEK:password", wrappedDEK);
      await set("accounts:cache", { version: 0, updatedAt: new Date().toISOString(), map: {} });
    } catch {
      // Local cache write failed, but server account creation succeeded
    }
    toast.update(id, { message: "Account created", type: "success" });
    showConfirmModal.value = false;
    await navigateTo("/");
  } catch (e: unknown) {
    toast.update(id, { message: getWriteErrorMessage(e, "create account"), type: "error" });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="relative min-h-screen flex items-center justify-center p-4">
    <!-- Interactive Cursor Glow active on Setup -->
    <BackgroundGlow />

    <div class="w-full max-w-sm">
      <div class="mb-6 text-center">
        <h1 class="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Setup your account
        </h1>
      </div>

      <UCard>
        <form class="space-y-4" @submit.prevent="handleCreateClick">
          <UFormField label="Password" required>
            <UInput
              v-model="password"
              :type="show ? 'text' : 'password'"
              placeholder="Create a strong password"
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

            <div class="mt-2.5 p-3 rounded-md bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
              <div
                v-for="req in requirements"
                :key="req.key"
                class="flex items-center gap-2 text-xs transition-colors"
                :class="req.met ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-neutral-600 dark:text-neutral-400'"
              >
                <UIcon
                  :name="req.met ? 'i-lucide-check' : 'i-lucide-circle-dot'"
                  class="size-3.5 shrink-0"
                  :class="req.met ? 'text-emerald-600 dark:text-emerald-400 stroke-[2.5]' : 'text-neutral-400 dark:text-neutral-600'"
                />
                <span>{{ req.text }}</span>
              </div>
            </div>
          </UFormField>

          <UFormField label="Confirm password" required>
            <UInput
              v-model="confirm"
              :type="show ? 'text' : 'password'"
              placeholder="Repeat password"
              size="md"
              required
              :ui="{ base: 'h-10' }"
            />
            <div
              v-if="confirm"
              class="text-xs mt-1.5 flex items-center gap-1.5 font-medium"
              :class="passwordsMatch ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
            >
              <UIcon :name="passwordsMatch ? 'i-lucide-check' : 'i-lucide-x'" class="size-3.5" />
              <span>{{ passwordsMatch ? 'Passwords match' : 'Passwords do not match' }}</span>
            </div>
          </UFormField>

          <UButton type="submit" block size="md" class="h-10 mt-2 cursor-pointer" :disabled="loading">
            Create account
          </UButton>
        </form>
      </UCard>
    </div>

    <!-- Confirmation Adaptive Modal (Desktop Modal / Mobile Drawer) -->
    <AdaptiveModal
      v-model:open="showConfirmModal"
      title="Confirm account creation"
      description="Important security warning"
    >
      <template #body>
        <div class="space-y-4">
          <div class="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex gap-2.5 items-start">
            <UIcon name="i-lucide-triangle-alert" class="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p>
              Your data is encrypted end-to-end. If you lose this password, <span class="font-medium underline decoration-amber-500/40">your account cannot be recovered</span>.
            </p>
          </div>

          <UFormField label="Confirmation" required>
            <template #label>
              <span class="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                Type <span class="font-mono font-semibold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded border border-neutral-300 dark:border-neutral-700">I confirm</span> to proceed:
              </span>
            </template>
            <UInput
              v-model="confirmText"
              placeholder="I confirm"
              size="md"
              autocomplete="off"
              :ui="{ base: 'h-10' }"
              @keyup.enter="onConfirm"
            />
          </UFormField>

          <div class="flex gap-2 justify-end pt-1">
            <UButton color="neutral" variant="ghost" size="sm" class="cursor-pointer" :disabled="loading" @click="showConfirmModal = false">
              Cancel
            </UButton>
            <UButton
              size="sm"
              class="cursor-pointer"
              :disabled="confirmText.trim().toLowerCase() !== 'i confirm'"
              :loading="loading"
              @click="onConfirm"
            >
              Confirm & create
            </UButton>
          </div>
        </div>
      </template>
    </AdaptiveModal>
  </div>
</template>
