<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import { toast } from "@steveyuowo/vue-hot-toast";

const props = defineProps<{ account: AccountEdit; accountId: number }>();

const emit = defineEmits(["close"]);

const state = reactive<AccountEdit>({ ...props.account });

const searchIcon = ref("");

const searchIconDebounced = refDebounced(searchIcon, 300);

const icons = ref<Icon[]>([]);

const loading = ref(false);

async function updateAccount(event: FormSubmitEvent<AccountEdit>) {
  loading.value = true;
  const toastid = toast.loading("loading...");
  await $fetch("/api/accounts", {
    method: "PATCH",
    query: { id: props.accountId },
    body: event.data,
  })
    .then(async (res) => {
      toast.update(toastid, {
        message: res.message,
        type: "success",
      });
      await refreshNuxtData("accounts");
      emit("close");
    })
    .catch((err) => {
      toast.update(toastid, {
        message: err?.data?.message ?? err,
        type: "error",
      });
      console.error(err);
    });
  loading.value = false;
}

async function onError(event: FormErrorEvent) {
  console.log(event.errors[0]);
  if (event.errors[0]?.message) {
    toast.error(event.errors[0].message);
  }
}

watch(searchIconDebounced, async (query) => {
  icons.value = await getIcons(query);
});
</script>

<template>
  <UModal title="Edit" :close="false" :dismissible="false">
    <template #body>
      <UForm
        :schema="accountEditSchema"
        :state="state"
        @submit="updateAccount"
        @error="onError"
      >
        <UFormField size="xl" label="Icon" name="icon" required>
          <UInputMenu
            v-model:search-term="searchIcon"
            v-model="state.icon"
            ignore-filter
            :items="icons || []"
            :icon="state.icon"
            :placeholder="state.issuer"
            size="xl"
            value-key="icon"
            required
          >
            <template #empty>Type something to search</template>
          </UInputMenu>
        </UFormField>
        <UFormField size="xl" label="Issuer" name="issuer" required>
          <UInput
            v-model="state.issuer"
            size="xl"
            required
            icon="i-heroicons-building-office-2"
          />
        </UFormField>
        <UFormField size="xl" label="Label" name="label" required>
          <UInput
            v-model="state.label"
            size="xl"
            required
            icon="i-heroicons-envelope"
          />
        </UFormField>
        <div class="flex w-full justify-end space-x-4 mt-4 px-3">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            size="lg"
            @click="emit('close')"
          />
          <UButton type="submit" :disabled="loading" variant="soft" size="md"
            >Submit</UButton
          >
        </div>
      </UForm>
    </template>
  </UModal>
</template>
