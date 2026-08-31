<script setup lang="ts">
import AdaptiveModal from "./AdaptiveModal.vue";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import { toast } from "@steveyuowo/vue-hot-toast";
import { ensureOnline } from "~/utils/offline";

const props = defineProps<{ account: AccountEdit; accountId: string }>();

const emit = defineEmits(["close"]);

const state = reactive<AccountEdit>({ ...props.account });

const searchIcon = ref("");

const searchIconDebounced = refDebounced(searchIcon, 300);

const icons = ref<Icon[]>([]);

const loading = ref(false);

async function updateAccount(event: FormSubmitEvent<AccountEdit>) {
  if (!ensureOnline("save changes")) return;

  const { data: accountsData } = useNuxtData<CipherAccount[]>("accounts");
  const prevSnapshot = accountsData.value ? [...accountsData.value] : [];

  // Optimistically update memory so the tile reflects edits instantly
  if (accountsData.value) {
    accountsData.value = accountsData.value.map((acc) =>
      acc.id === props.accountId ? { ...acc, ...event.data } : acc
    );
  }

  // Dismiss modal immediately
  emit("close");

  const toastid = toast.loading("Saving...");
  $fetch<{ status: number; message: string; version: number }>("/api/accounts", {
    method: "PATCH",
    query: { id: props.accountId },
    body: event.data,
  })
    .then(async (res) => {
      toast.update(toastid, {
        message: res.message || "Updated successfully",
        type: "success",
      });
      await updateCachedAccountFields(props.accountId, event.data, res.version);
    })
    .catch(async (err) => {
      toast.update(toastid, {
        message: err?.data?.message ?? String(err),
        type: "error",
      });
      // Rollback on failure
      if (accountsData.value) {
        accountsData.value = prevSnapshot;
      }
      await refreshNuxtData("accounts");
      console.error(err);
    });
}

async function onError(event: FormErrorEvent) {
  toast.error(event.errors[0]?.message ?? "Validation error");
}

watch(searchIconDebounced, async (query) => {
  icons.value = await getIcons(query);
});
</script>

<template>
  <AdaptiveModal title="Edit Account" description="Update details for this authenticator">
    <template #body>
      <UForm
        :schema="accountEditSchema"
        :state="state"
        class="space-y-4"
        @submit="updateAccount"
        @error="onError"
      >
        <UFormField label="Icon" name="icon" required>
          <UInputMenu
            v-model="state.icon"
            v-model:search-term="searchIcon"
            ignore-filter
            :items="icons || []"
            :icon="state.icon"
            :placeholder="state.issuer"
            size="md"
            value-key="icon"
            required
            :ui="{ base: 'h-10' }"
          >
            <template #empty>Type something to search</template>
          </UInputMenu>
        </UFormField>

        <UFormField label="Issuer" name="issuer" required>
          <UInput
            v-model="state.issuer"
            size="md"
            required
            icon="i-heroicons-building-office-2"
            :ui="{ base: 'h-10' }"
          />
        </UFormField>

        <UFormField label="Label" name="label" required>
          <UInput
            v-model="state.label"
            size="md"
            required
            icon="i-heroicons-envelope"
            :ui="{ base: 'h-10' }"
          />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            size="sm"
            class="cursor-pointer"
            @click="emit('close')"
          />
          <UButton
            type="submit"
            :disabled="loading"
            :loading="loading"
            size="sm"
            class="cursor-pointer"
            >Save changes</UButton
          >
        </div>
      </UForm>
    </template>
  </AdaptiveModal>
</template>


