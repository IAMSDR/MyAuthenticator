<script setup lang="ts">
import QrcodeVue from "qrcode.vue";
import type { RenderAs, Level } from "qrcode.vue";

defineProps<{
  uri: string;
}>();

const level = ref<Level>("M");
const renderAs = ref<RenderAs>("svg");
</script>

<template>
  <UModal title="Share Account" description="Scan QR code with another authenticator app">
    <template #body>
      <div class="flex-center flex-col pb-2 space-y-4">
        <div
          class="p-4 bg-white rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm w-max"
        >
          <QrcodeVue
            :value="uri"
            :level="level"
            :size="190"
            background="white"
            foreground="#0a0a0a"
            :render-as="renderAs"
          />
        </div>
        <div class="w-full rounded-md bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-3">
          <p class="text-xs font-mono break-all text-neutral-600 dark:text-neutral-400 select-all">{{ uri }}</p>
        </div>
        <span
          class="text-neutral-500 dark:text-neutral-400 text-center text-xs max-w-xs"
        >
          Scan the QR code above or copy the URI to import this authenticator.
        </span>
      </div>
    </template>
  </UModal>
</template>



