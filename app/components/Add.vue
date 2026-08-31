<script setup lang="ts">
import AdaptiveModal from "./AdaptiveModal.vue";
import Form from "./Form.vue";
import Qrscan from "./Qrscan.vue";

const overlay = useOverlay();
const emit = defineEmits(["close"]);

const formModal = overlay.create(Form);
const qrModal = overlay.create(Qrscan);

const openForm = () => {
  emit("close");
  setTimeout(() => formModal.open(), 200);
};

const openQrscan = () => {
  emit("close");
  setTimeout(() => qrModal.open(), 200);
};
</script>

<template>
  <AdaptiveModal title="Add authenticator" description="Choose how to add your account">
    <template #body>
      <div class="space-y-2.5">
        <button
          type="button"
          class="w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 hover:border-neutral-300 dark:hover:border-neutral-700 text-left transition-all cursor-pointer group"
          @click="openQrscan"
        >
          <div class="size-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:bg-primary-500/10 transition-colors">
            <UIcon name="i-lucide-qr-code" class="size-5" />
          </div>
          <div class="flex-1 min-w-0">
            <span class="block text-sm font-semibold text-neutral-900 dark:text-neutral-100">Scan QR Code</span>
            <span class="block text-xs text-neutral-500 dark:text-neutral-400">Use your camera or upload a QR image</span>
          </div>
          <UIcon name="i-lucide-chevron-right" class="size-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          class="w-full flex items-center gap-3.5 p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 hover:border-neutral-300 dark:hover:border-neutral-700 text-left transition-all cursor-pointer group"
          @click="openForm"
        >
          <div class="size-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:bg-primary-500/10 transition-colors">
            <UIcon name="i-lucide-key-round" class="size-5" />
          </div>
          <div class="flex-1 min-w-0">
            <span class="block text-sm font-semibold text-neutral-900 dark:text-neutral-100">Enter Setup Key</span>
            <span class="block text-xs text-neutral-500 dark:text-neutral-400">Manually enter secret key and options</span>
          </div>
          <UIcon name="i-lucide-chevron-right" class="size-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </template>
  </AdaptiveModal>
</template>
