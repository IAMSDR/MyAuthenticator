<template>
  <div class="h-dvh overflow-hidden flex flex-center">
    <UCard
      :ui="{
        base: 'w-full max-w-md',
        body: {
          padding: 'px-3 md:px-5 xl:px-8 py-3',
          base: 'flex-center flex-col',
        },
      }"
    >
      <span
        className="text-lg xs:text-xl font-semibold uppercase mb-2 self-center"
        >Telegram Bot Setup</span
      >
      <div v-if="error" class="flex-center p-2 space-y-3 font-mono">
        <span v-if="error.statusCode == 400"
          >To set up your Telegram bot, please configure the necessary
          environment variables.</span
        >
        <span v-else>{{ error.message }}</span>
      </div>
      <div v-else class="flex-center flex-col space-y-3 my-5">
        <span
          >webhook set :<UBadge
            :color="data?.isSet ? 'green' : 'red'"
            variant="soft"
            class="w-max ml-2 capitalize"
            >{{ data?.isSet }}</UBadge
          ></span
        >
        <div
          class="h-max w-full overflow-scroll rounded-lg bg-gray-200 dark:bg-gray-950"
        >
          <pre
            class="p-3 m-1 whitespace-pre-wrap text-xs sm:text-sm font-mono text-gray-700 dark:text-gray-400 w-full"
            >{{ JSON.stringify(data?.webhookData, null, 2) }}</pre
          >
        </div>
        <UButton class="w-max mt-2.5 mx-auto" @click="setWebhook" variant="soft"
          >{{ data?.isSet ? "update" : "set" }} webhook</UButton
        >
        <span
          class="text-xs text-gray-400 dark:text-gray-400 text-center mt-3 mb-2"
          >*It will set or update the bot webhook url with current
          hostname</span
        >
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { toast } from "@steveyuowo/vue-hot-toast";

definePageMeta({
  middleware: "auth",
});

const { data, error, refresh } = await useFetch("/api/telegram");

const setWebhook = async () => {
  const toastId = toast.loading("Loading...");
  await $fetch("/api/telegram/setwebhook")
    .then(async (data) => {
      await refresh();
      toast.update(toastId, {
        type: "success",
        message: "webhook set successfully",
      });
    })
    .catch((err: Error) => {
      console.log(err);
      toast.update(toastId, {
        type: "error",
        message: err.message,
      });
    });
};
</script>
