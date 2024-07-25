<template>
  <UModal>
    <UButton
      icon="i-heroicons-qr-code-solid"
      color="primary"
      variant="ghost"
      block
      class="gap-x-3 p-2.5 px-6"
      @click="openQr"
      >Scan QR Code</UButton
    >
    <hr class="my-3 border-t border-primary-200 dark:border-primary-900" />
    <UButton
      color="primary"
      class="gap-x-3 p-2.5 px-6 rounded-none hover:rounded-md"
      variant="ghost"
      icon="i-heroicons-key-solid"
      block
      @click="openForm"
      >Enter Setup Key</UButton
    >
  </UModal>
</template>

<script setup lang="ts">
import Qrcode from "~/components/QrcodeScanner.vue";
import Form from "~/components/Form.vue";

const modal = useModal();

const openForm = async () => {
  await modal.close();
  setTimeout(() => modal.open(Form), 400);
};

const openQr = async () => {
  await modal.close();
  setTimeout(() => modal.open(Qrcode), 400);
};
</script>
