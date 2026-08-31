<script setup lang="ts">
import ThemePicker from "./ThemePicker.vue";
import Passkeys from "./Passkeys.vue";
import BackupAndRestore from "./BackupAndRestore.vue";
import ChangePassword from "./ChangePassword.vue";

const { clear } = useUserSession();
const { clearDEK } = useEncryption();

const overlay = useOverlay();

const themePickerModal = overlay.create(ThemePicker);
const passkeysModal = overlay.create(Passkeys);
const backupAndRestoreModal = overlay.create(BackupAndRestore);
const changePasswordModal = overlay.create(ChangePassword);

const logout = async () => {
  clearDEK();
  await $fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  await clear();
  reloadNuxtApp({ path: "/", force: true });
};

const items = [
  {
    label: "Theme & Style",
    description: "Customize appearance and colors",
    icon: "i-solar-palette-round-bold",
    action: () => themePickerModal.open(),
  },
  {
    label: "Passkeys",
    description: "Biometric sign-in and device management",
    icon: "i-carbon-fingerprint-recognition",
    action: () => passkeysModal.open(),
  },
  {
    label: "Backup & Restore",
    description: "Export encrypted backup or import",
    icon: "i-tabler-restore",
    action: () => backupAndRestoreModal.open(),
  },
  {
    label: "Change Password",
    description: "Update your vault master password",
    icon: "i-heroicons-key-solid",
    action: () => changePasswordModal.open(),
  },
];
</script>

<template>
  <UModal title="Menu" description="Settings & Preferences">
    <template #body>
      <div class="space-y-1.5">
        <button
          v-for="item in items"
          :key="item.label"
          class="w-full flex items-center gap-3.5 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 text-left transition-colors cursor-pointer"
          @click="item.action"
        >
          <div class="size-8 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
            <UIcon :name="item.icon" class="size-4.5 text-primary-600 dark:text-primary-400" />
          </div>
          <div class="flex-1 min-w-0">
            <span class="block text-sm font-semibold text-neutral-900 dark:text-neutral-100">{{ item.label }}</span>
            <span class="block text-xs text-neutral-500 dark:text-neutral-400">{{ item.description }}</span>
          </div>
          <UIcon name="i-lucide-chevron-right" class="size-4 text-neutral-400" />
        </button>

        <USeparator class="my-2" />

        <button
          class="w-full flex items-center gap-3.5 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-left transition-colors cursor-pointer"
          @click="logout"
        >
          <div class="size-8 rounded-md bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400">
            <UIcon name="i-solar-logout-outline" class="size-4.5" />
          </div>
          <span class="text-sm font-semibold text-red-600 dark:text-red-400">Logout</span>
        </button>
      </div>
    </template>
  </UModal>
</template>


