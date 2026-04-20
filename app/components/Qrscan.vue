<script setup lang="ts">
import { QrcodeStream, QrcodeCapture } from "vue-qrcode-reader";
import type { DetectedBarcode } from "barcode-detector/pure";
import { toast } from "@steveyuowo/vue-hot-toast";

const emit = defineEmits(["close"]);

const state = reactive({
  errorMsg: "",
  error: false,
  loading: true,
});

const extractAccountsFromQrCodeData = async (data: string) => {
  if (data.startsWith("otpauth://"))
    return await extractAccountsFromUriList([data]);
  else if (data.startsWith("otpauth-migration://offline"))
    return await extractAccountsFromGoogleUri(data);
  else return;
};

const onDetect = async (response: DetectedBarcode[]) => {
  console.log(response);
  response.forEach(async (res) => {
    const toastId = toast.loading("Loading...");
    const accounts: Accounts =
      (await extractAccountsFromQrCodeData(res.rawValue)) ?? [];
    if (!accounts.length) {
      toast.update(toastId, { message: "Invalid Qrcode", type: "error" });
      return;
    }
    await $fetch("/api/accounts", {
      method: "POST",
      body: accounts,
    })
      .then(async (res) => {
        toast.update(toastId, {
          message: res.message,
          type: "success",
        });
        await refreshNuxtData("accounts");
        emit("close");
      })
      .catch((err) => {
        toast.update(toastId, {
          message: err?.data?.message ?? err,
          type: "error",
        });
        console.error(err);
      });
  });
};

const onReady = (capabilities: MediaTrackCapabilities) => {
  state.loading = false;
  console.log(capabilities);
};

const onError = (error: Error) => {
  state.error = true;
  if (error.name === "NotAllowedError")
    state.errorMsg = "Camera Permission Denied";
  else if (error.name === "NotFoundError") state.errorMsg = "Camera Not Found";
  else if (error.name === "NotSupportedError") state.errorMsg = "Not Supported";
  else if (error.name === "NotReadableError")
    state.errorMsg = "Camera Not Readable";
  else if (error.name === "OverconstrainedError")
    state.errorMsg = "Over Constrained";
  else if (error.name === "StreamApiNotSupportedError")
    state.errorMsg = "Browser Not Supported";
  else state.errorMsg = error.name;
  toast.error(state.errorMsg);
};
</script>

<template>
  <UModal title="Scan QR Code" :close="false">
    <template #body>
      <QrcodeStream
        v-if="!state.error"
        class="h-full w-full overflow-hidden rounded-[calc(var(--ui-radius)*2)] border-2 border-neutral-700"
        @camera-on="onReady"
        @detect="onDetect"
        @error="onError"
      >
        <div v-show="state.loading" class="h-full w-full flex-center">
          Loading Camera ....
        </div>
      </QrcodeStream>
      <div
        v-else
        class="min-h-32 flex-center flex-col space-y-2 font-semibold text-red-600"
      >
        <UIcon name="i-heroicons-camera-solid" />
        <span>{{ state.errorMsg }}</span>
      </div>
      <USeparator label="OR" color="neutral" size="sm" :ui="{ root: 'my-4' }" />
      <div class="flex-center relative">
        <UButton size="sm" variant="soft" icon="i-heroicons-photo-16-solid">
          <label for="fileinput" class="cursor-pointer">Upload Image</label>
          <QrcodeCapture id="fileinput" class="w-0" @detect="onDetect" />
        </UButton>
      </div>
    </template>
  </UModal>
</template>
