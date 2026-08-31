<script setup lang="ts">
import { QrcodeStream, QrcodeCapture } from "vue-qrcode-reader";
import type { DetectedBarcode } from "barcode-detector/pure";
import { toast } from "@steveyuowo/vue-hot-toast";
import { ensureOnline } from "~/utils/offline";

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
  for (const res of response) {
    if (!ensureOnline("add scanned authenticators")) return;
    const toastId = toast.loading("Processing QR code...");
    const accounts: Accounts =
      (await extractAccountsFromQrCodeData(res.rawValue)) ?? [];
    if (!accounts.length) {
      toast.update(toastId, { message: "Invalid QR code", type: "error" });
      return;
    }
    const { dek } = useEncryption();
    if (!dek.value) {
      toast.update(toastId, { message: "Vault locked", type: "error" });
      return;
    }
    const cipher: CipherAccount[] = [];
    for (const acc of accounts) {
      const s = await encryptWithKey(acc.secret, dek.value);
      cipher.push({
        ...acc,
        id: crypto.randomUUID(),
        secret: s,
        createdAt: new Date().toISOString(),
      } as CipherAccount);
    }
    await $fetch("/api/accounts", {
      method: "POST",
      body: cipher,
    })
      .then(async (res) => {
        toast.update(toastId, {
          message: (res as any).message,
          type: "success",
        });
        await refreshNuxtData("accounts");
        emit("close");
      })
      .catch((err) => {
        toast.update(toastId, {
          message: err?.data?.message ?? String(err),
          type: "error",
        });
        console.error(err);
      });
  }
};

const onReady = (capabilities?: MediaTrackCapabilities) => {
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
  <UModal title="Scan QR Code" description="Point your camera or upload a QR image">
    <template #body>
      <div class="space-y-4">
        <div class="relative overflow-hidden rounded-lg bg-neutral-950 aspect-square flex items-center justify-center border border-neutral-800">
          <QrcodeStream
            v-if="!state.error"
            class="absolute inset-0 w-full h-full object-cover"
            @camera-on="onReady"
            @detect="onDetect"
            @error="onError"
          >
            <div v-if="state.loading" class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-950 text-white">
              <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin text-primary-500" />
              <span class="text-xs text-neutral-400">Starting camera...</span>
            </div>
            <div v-else class="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div class="size-48 rounded-lg border-2 border-primary-500/70 shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
            </div>
          </QrcodeStream>
          <div v-else class="text-center p-6 space-y-2">
            <UIcon name="i-lucide-camera-off" class="size-8 mx-auto text-neutral-500" />
            <p class="text-sm text-white font-medium">{{ state.errorMsg }}</p>
            <p class="text-xs text-neutral-400">Please allow camera permissions or upload an image.</p>
          </div>
        </div>

        <USeparator label="or" color="neutral" size="sm" />

        <div class="flex justify-center">
          <UButton color="neutral" variant="soft" size="sm" icon="i-heroicons-photo-16-solid" class="cursor-pointer">
            <label for="fileinput" class="cursor-pointer">Upload image file</label>
            <QrcodeCapture id="fileinput" class="hidden" @detect="onDetect" />
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>


