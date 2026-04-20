<script setup lang="ts">
import Form from "./Form.vue";
import Qrscan from "./Qrscan.vue";

const overlay = useOverlay();

const emit = defineEmits(["close"]);

const formModal = overlay.create(Form);
const qrModal = overlay.create(Qrscan);

const openForm = async () => {
  emit("close");
  setTimeout(() => formModal.open(), 300);
};

const openQrscan = async () => {
  emit("close");
  setTimeout(() => qrModal.open(), 300);
};
</script>

<template>
  <UModal :ui="{ content: 'p-2' }">
    <template #content>
      <UButton
        icon="i-heroicons-qr-code-solid"
        color="primary"
        variant="ghost"
        block
        class="gap-x-3 p-3 px-6"
        @click="openQrscan"
        >Scan QR Code</UButton
      >
      <hr class="my-2 border-t border-(--ui-primary)/30" >
      <UButton
        color="primary"
        class="gap-x-3 p-3 px-6"
        variant="ghost"
        icon="i-heroicons-key-solid"
        block
        @click="openForm"
        >Enter Setup Key</UButton
      >
    </template>
  </UModal>
</template>
