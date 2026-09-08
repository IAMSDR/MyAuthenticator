<script setup lang="ts">
import AdaptiveModal from "./AdaptiveModal.vue";
import ThemePicker from "./ThemePicker.vue";
import Passkeys from "./Passkeys.vue";
import BackupAndRestore from "./BackupAndRestore.vue";
import ChangePassword from "./ChangePassword.vue";

const emit = defineEmits(["close"]);
const { clear } = useUserSession();
const { clearDEK } = useEncryption();

const overlay = useOverlay();
const themePickerModal = overlay.create(ThemePicker);
const passkeysModal = overlay.create(Passkeys);
const backupAndRestoreModal = overlay.create(BackupAndRestore);
const changePasswordModal = overlay.create(ChangePassword);

const logout = async () => {
  emit("close");
  clearDEK();
  // Do not delete Workbox precache caches — would break offline refresh.
  // Only clear volatile runtime caches if needed (e.g. iconify-api), keep 'workbox-precache-*'.
  if (import.meta.client && "caches" in window) {
    try {
      const cacheNames = await window.caches.keys();
      const deletable = cacheNames.filter((n) => !n.startsWith("workbox-precache"));
      // Further restrict to our runtime caches; keep precache intact.
      const runtimeOnly = deletable.filter((n) => n === "iconify-api");
      await Promise.all(runtimeOnly.map((name) => window.caches.delete(name)));
    } catch {
      // ignore cache clearing error
    }
  }
  // Offline: no server call — local lock/logout still completes.
  if (typeof navigator === "undefined" || navigator.onLine !== false) {
    await $fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  }
  await clear().catch(() => {});
  await navigateTo("/login", { replace: true });
};

const items = [
  {
    label: "Theme & Style",
    description: "Customize appearance and colors",
    icon: "i-lucide-palette",
    action: () => themePickerModal.open(),
  },
  {
    label: "Passkeys",
    description: "Biometric sign-in and device keys",
    icon: "i-lucide-fingerprint",
    action: () => passkeysModal.open(),
  },
  {
    label: "Backup & Restore",
    description: "Export encrypted vault or import data",
    icon: "i-lucide-archive-restore",
    action: () => backupAndRestoreModal.open(),
  },
  {
    label: "Change Password",
    description: "Update your master vault password",
    icon: "i-lucide-key-round",
    action: () => changePasswordModal.open(),
  },
];
</script>

<template>
  <AdaptiveModal title="Settings & Menu" description="Preferences and vault management">
    <template #body>
      <div class="space-y-1.5">
        <button
          v-for="item in items"
          :key="item.label"
          type="button"
          class="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/60 border border-transparent hover:border-neutral-200/80 dark:hover:border-neutral-800/80 text-left transition-all cursor-pointer group"
          @click="item.action"
        >
          <div class="size-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 group-hover:bg-(--ui-primary)/10 group-hover:text-(--ui-primary) transition-colors">
            <UIcon :name="item.icon" class="size-4.5" />
          </div>
          <div class="flex-1 min-w-0">
            <span class="block text-sm font-semibold text-neutral-900 dark:text-neutral-100">{{ item.label }}</span>
            <span class="block text-xs text-neutral-500 dark:text-neutral-400">{{ item.description }}</span>
          </div>
          <UIcon name="i-lucide-chevron-right" class="size-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <USeparator class="my-2" />

        <button
          type="button"
          class="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 text-left transition-colors cursor-pointer group"
          @click="logout"
        >
          <div class="size-9 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400">
            <UIcon name="i-lucide-log-out" class="size-4.5" />
          </div>
          <div class="flex-1 min-w-0">
            <span class="block text-sm font-semibold text-red-600 dark:text-red-400">Lock & Sign Out</span>
            <span class="block text-xs text-neutral-500 dark:text-neutral-400">Clear memory key and sign out</span>
          </div>
        </button>
      </div>
    </template>
  </AdaptiveModal>
</template>
