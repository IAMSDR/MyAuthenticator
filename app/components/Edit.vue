<script setup lang="ts">
import AdaptiveModal from "./AdaptiveModal.vue";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import { toast } from "@steveyuowo/vue-hot-toast";
import { ensureOnline, getWriteErrorMessage, onlineNow } from "~/utils/offline";

const props = defineProps<{ account: AccountEdit; accountId: string }>();

const emit = defineEmits(["close"]);

const state = reactive<AccountEdit>({ ...props.account });

const searchIcon = ref("");
const searchIconDebounced = refDebounced(searchIcon, 300);

const icons = ref<Icon[]>([]);
const searchingIcons = ref(false);

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
        message: getWriteErrorMessage(err, "save changes"),
        type: "error",
      });
      // Rollback on failure
      if (accountsData.value) {
        accountsData.value = prevSnapshot;
      }
      if (onlineNow()) await refreshNuxtData("accounts");
      console.error(err);
    });
}

async function onError(event: FormErrorEvent) {
  toast.error(event.errors[0]?.message ?? "Validation error");
}

watch(searchIconDebounced, async (query) => {
  if (!query?.trim()) {
    icons.value = [];
    searchingIcons.value = false;
    return;
  }
  searchingIcons.value = true;
  try {
    icons.value = await getIcons(query);
  } finally {
    searchingIcons.value = false;
  }
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
            :loading="searchingIcons"
            :placeholder="state.issuer || 'Search icon'"
            size="md"
            value-key="icon"
            required
            class="w-full"
            :ui="{ base: 'h-10' }"
          >
            <template #item-leading="{ item }">
              <UIcon :name="item.icon" class="size-4 shrink-0" />
            </template>
            <template #item-trailing="{ item }">
              <span v-if="item.description" class="text-[10px] uppercase font-mono text-neutral-400 dark:text-neutral-500">
                {{ item.description }}
              </span>
            </template>
            <template #empty>
              <span v-if="searchingIcons">Searching icons...</span>
              <span v-else-if="searchIcon">No icons found for "{{ searchIcon }}"</span>
              <span v-else>Type to search brand or icon</span>
            </template>
          </UInputMenu>
        </UFormField>

        <UFormField label="Issuer" name="issuer" required>
          <UInput
            v-model="state.issuer"
            size="md"
            required
            icon="i-lucide-building-2"
            :ui="{ base: 'h-10' }"
          />
        </UFormField>

        <UFormField label="Label" name="label" required>
          <UInput
            v-model="state.label"
            size="md"
            required
            icon="i-lucide-mail"
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


