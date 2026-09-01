<script setup lang="ts">
import AdaptiveModal from "./AdaptiveModal.vue";
import { toast } from "@steveyuowo/vue-hot-toast";
import { ensureOnline } from "~/utils/offline";

const oldPassword = ref("");
const newPassword = ref("");
const confirm = ref("");
const loading = ref(false);
const show = ref(false);
const emit = defineEmits(["close"]);

const onSubmit = async () => {
  if (newPassword.value !== confirm.value) {
    toast.error("Passwords do not match");
    return;
  }
  const p = passwordSchema.safeParse({ password: newPassword.value });
  if (!p.success) {
    toast.error(p.error.issues[0]?.message ?? "Invalid password");
    return;
  }
  const { dek } = useEncryption();
  if (!dek.value) {
    toast.error("Vault locked");
    return;
  }
  if (!ensureOnline("change password")) return;
  loading.value = true;
  const id = toast.loading("Updating...");
  try {
    const b64 = await exportKeyToBase64(dek.value);
    const wrapped = await encryptWithPassword(b64, newPassword.value);
    await $fetch("/api/auth/change-password", {
      method: "POST",
      body: {
        newWrappedDEK: wrapped,
        password: newPassword.value,
        oldPassword: oldPassword.value || undefined,
      },
    });
    const { set } = await import("idb-keyval");
    await set("wrappedDEK:password", wrapped);
    toast.update(id, { message: "Password changed successfully", type: "success" });
    emit("close");
  } catch (e: any) {
    toast.update(id, { message: e?.data?.message ?? String(e), type: "error" });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <AdaptiveModal
    title="Change Password"
    description="Update your master encryption password"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <UFormField label="Current password">
          <UInput
            v-model="oldPassword"
            :type="show ? 'text' : 'password'"
            placeholder="Current master password"
            icon="i-lucide-lock"
            size="md"
            :ui="{ base: 'h-10' }"
          />
        </UFormField>

        <UFormField label="New password" required>
          <UInput
            v-model="newPassword"
            :type="show ? 'text' : 'password'"
            placeholder="New master password (min 8 chars)"
            icon="i-lucide-key-round"
            size="md"
            required
            :ui="{ base: 'h-10' }"
          />
        </UFormField>

        <UFormField label="Confirm new password" required>
          <UInput
            v-model="confirm"
            :type="show ? 'text' : 'password'"
            placeholder="Confirm new master password"
            icon="i-lucide-key-round"
            size="md"
            required
            :ui="{ base: 'h-10' }"
          />
        </UFormField>

        <div class="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
          <input id="showPw" v-model="show" type="checkbox" class="rounded cursor-pointer" />
          <label for="showPw" class="cursor-pointer">Show passwords</label>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            size="sm"
            class="cursor-pointer"
            @click="emit('close')"
          />
          <UButton
            type="submit"
            size="sm"
            class="cursor-pointer"
            :loading="loading"
            :disabled="loading"
            >Update password</UButton
          >
        </div>
      </form>
    </template>
  </AdaptiveModal>
</template>


