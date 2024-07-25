<template>
  <UModal>
    <div class="h-full flex-center flex-col w-full max-w-sm">
      <span className="text-lg xs:text-xl font-semibold uppercase mb-2">
        Qrcode</span
      >
      <div
        class="p-2 bg-white rounded-md border-2 dark:border-none border-gray-500"
      >
        <qrcode-vue
          :value="uri"
          :level="level"
          :size="200"
          :render-as="renderAs"
          background="white"
        />
      </div>
      <span
        class="mt-5 text-gray-600 dark:text-gray-300 leading-normal text-center font-medium text-xs max-w-xs"
      >
        Please scan the QR code above with
        {{
          isGoogleUri
            ? `the Google Authenticator app to export these accounts`
            : `any authenticator app like Google
        Authenticator to copy this account`
        }}
      </span>
      <div class="flex w-full max-w-xs justify-end space-x-2 mt-3 p-2 relative">
        <UButton
          @click="modal.close()"
          label="close"
          size="lg"
          variant="ghost"
        />
      </div>
    </div>
  </UModal>
</template>

<script setup lang="ts">
import QrcodeVue from "qrcode.vue";
import type { Level, RenderAs } from "qrcode.vue";

const props = defineProps<{
  uri: string;
  isGoogleUri?: boolean;
}>();

console.log(props.uri);

const level = ref<Level>("Q");
const renderAs = ref<RenderAs>("svg");

const modal = useModal();
</script>
