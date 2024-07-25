<template>
  <UModal>
    <form
      @submit.prevent="downloadBackupFile"
      class="flex flex-col w-full max-w-sm mx-auto"
    >
      <span
        className="text-lg xs:text-xl self-center font-semibold uppercase mb-4"
        >Backup</span
      >
      <UButton
        icon="i-simple-icons-googleauthenticator"
        color="primary"
        variant="ghost"
        block
        class="gap-x-3 p-2.5 px-6"
        @click.prevent="exportToGoogleAuthenticator"
        >Export to Google Authenticator</UButton
      >
      <UDivider label="OR" class="text-xs font-mono mt-2" size="xs" />
      <UInput
        placeholder="password for encryption"
        icon="i-heroicons-key"
        name="secret"
        size="lg"
        required
        class="mt-5"
        v-model="password"
        minlength="6"
      />
      <UButton
        type="submit"
        icon="i-heroicons-document-arrow-up-solid"
        variant="soft"
        class="self-center mt-6"
      >
        Download Backup File
      </UButton>
    </form>
  </UModal>
</template>

<script setup lang="ts">
import { toast } from "@steveyuowo/vue-hot-toast";
import { type Account } from "~/types";
import Share from "~/components/Share.vue";

const password = ref<string>("");

const modal = useModal();

const exportToGoogleAuthenticator = async () => {
  const accounts = useNuxtData<Account[]>("accounts");
  if (!accounts.data.value?.length) {
    toast.error("No accounts available to export");
    return;
  }
  const data = encodeToGoogleAuthenticatorUri(accounts.data.value);
  const uri = "otpauth-migration://offline?data=" + data;
  await modal.close();
  setTimeout(
    () =>
      modal.open(Share, {
        uri: uri,
        isGoogleUri: true,
      }),
    350
  );
};

const downloadBackupFile = async () => {
  const toastId = toast.loading("Loading...");
  const accounts = useNuxtData<Account[]>("accounts");
  if (!accounts.data.value?.length) {
    toast.update(toastId, {
      type: "error",
      message: "No accounts available to export",
    });
    return;
  }
  const ed = await encryptWithPassword(
    JSON.stringify(accounts.data.value),
    password.value
  );
  const blob = new Blob([ed], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `MyAuthenticator-${new Date().toLocaleDateString()}.backup`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.update(toastId, {
    type: "success",
    message: "File Downloaded",
  });
  await modal.close();
};
</script>
