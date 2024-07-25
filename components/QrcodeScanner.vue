<template>
  <UModal>
    <div class="flex-col flex items-center">
      <span className="text-lg xs:text-xl font-semibold uppercase mb-4"
        >Scan Qr Code</span
      >
      <div class="h-full w-full flex-center p-5">
        <QrcodeStream
          class="h-full w-full overflow-hidden rounded-lg border-2 border-gray-700"
          v-if="!state.error"
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
          class="min-h-32 flex-center flex-col font-semibold text-red-600"
        >
          <UIcon name="i-heroicons-camera-solid" />
          {{ state.errorMsg }}
        </div>
      </div>
      <UDivider label="OR" class="text-xs font-mono" size="xs" />
      <div class="mt-5 flex-center">
        <UButton size="xs" variant="soft" icon="i-heroicons-photo-16-solid">
          <label for="fileinput" class="cursor-pointer">Upload Image</label>
          <QrcodeCapture class="w-0" id="fileinput" @detect="onDetect" />
        </UButton>
      </div>
    </div>
  </UModal>
</template>

<script setup lang="ts">
import { QrcodeStream, QrcodeCapture } from "vue-qrcode-reader";
import type { DetectedBarcode } from "barcode-detector/pure";
import { toast } from "@steveyuowo/vue-hot-toast";
import { handleQrcodeData } from "~/utils";

const modal = useModal();

const state = reactive({
  errorMsg: "",
  error: false,
  loading: true,
});

const onDetect = async (response: DetectedBarcode[]) => {
  response.forEach(async (res) => {
    const toastId = toast.loading("Loading...");
    const accounts = handleQrcodeData(res.rawValue);
    if (!accounts) {
      toast.update(toastId, {
        type: "error",
        message: "Invalid Qrcode !!",
      });
      return;
    }
    await $fetch("/api/accounts", {
      method: "post",
      body: accounts,
    })
      .then(async (data) => {
        toast.update(toastId, {
          type: "success",
          message: "Added successfully",
        });
        await refreshNuxtData("accounts");
        modal.close();
      })
      .catch((err: Error) => {
        console.log(err);
        toast.update(toastId, {
          type: "error",
          message: err.message,
        });
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
