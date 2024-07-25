<template>
  <UModal>
    <form
      @submit.prevent="restore"
      class="flex flex-col w-full max-w-sm mx-auto"
    >
      <span
        className="text-lg xs:text-xl self-center font-semibold uppercase mb-4"
        >Restore a Backup</span
      >
      <UInput
        type="file"
        icon="i-heroicons-document-text-solid"
        size="lg"
        class=""
        required
      />
      <UInput
        placeholder="decryption password"
        icon="i-heroicons-key"
        name="secret"
        size="lg"
        required
        class="mt-5"
        v-model="password"
        minlength="6"
      />
      <UButton type="submit" variant="soft" class="self-center mt-5">
        submit
      </UButton>
    </form>
  </UModal>
</template>

<script setup lang="ts">
import { toast } from "@steveyuowo/vue-hot-toast";
import type { Account } from "~/types";

const modal = useModal();
const password = ref<string>("");

const restore = async (event: Event) => {
  const toastId = toast.loading("Loading...");
  const form = event.target as HTMLFormElement;
  const fileInput = form[0] as HTMLInputElement;
  const file = fileInput.files?.[0];
  if (!file) return;
  const data = await readFileContent(file);
  let accounts: Account[] = [];
  await decryptWithPassword(data, password.value)
    .then(async (decryptedData) => {
      accounts = JSON.parse(decryptedData) as Account[];
    })
    .catch((err) => {
      console.log(err);
    });
  if (!accounts.length) {
    toast.update(toastId, {
      type: "error",
      message: "Invalid File or Password",
    });
    return;
  }
  // removing feild 'id' if exists
  accounts = accounts.map(({ ["id"]: _, ...remain }) => remain);
  await $fetch("/api/accounts", {
    method: "POST",
    body: accounts,
  })
    .then(async (data) => {
      await refreshNuxtData("accounts");
      modal.close();
      toast.update(toastId, {
        type: "success",
        message: "Added successfully",
      });
    })
    .catch((err: Error) => {
      console.log(err);
      toast.update(toastId, { type: "error", message: err.message });
    });
};

const readFileContent = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      resolve(result);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsText(file);
  });
};
</script>
