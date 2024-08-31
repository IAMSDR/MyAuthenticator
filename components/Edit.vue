<template>
  <UModal>
    <form
      @submit.prevent="edit"
      class="w-full max-w-md flex flex-col items-center"
    >
      <span className="text-lg xs:text-xl font-semibold uppercase mb-4"
        >Edit</span
      >
      <UFormGroup label="Icon" required size="xl">
        <div class="absolute right-1 -top-5 flex space-x-3 items-center">
          <span class="text-xs font-medium pb-1">simpleicons :</span>
          <UToggle
            @change="resetIcontype"
            v-model="selectedSimpleIcons"
            size="2xs"
          />
        </div>
        <UInputMenu
          :search="searchIcon"
          :loading="iconsLoading"
          placeholder="Google"
          v-model:query="iconQuery"
          v-model="state.icon"
          size="xl"
          required
          name="icon"
          trailing
        >
          <template #leading>
            <AccountIcon
              :isImg="!selectedSimpleIcons"
              :icon="state.icon"
              class="h-5 w-5"
              imgclass="h-4 p-4"
            />
          </template>
          <template #option="{ option: icon }">
            <AccountIcon
              :isImg="!selectedSimpleIcons"
              :icon="icon"
              class="h-4 w-4"
              imgclass="h-4 w-4"
            />
            <span class="truncate ml-2 capitalize">{{ icon }}</span>
          </template>
        </UInputMenu>
      </UFormGroup>
      <UFormGroup label="Issuer" size="xl" required>
        <UInput
          v-model="state.issuer"
          placeholder="ex: Google"
          icon="i-heroicons-building-office-2"
          name="issuer"
          required
        />
      </UFormGroup>
      <UFormGroup label="Label" size="xl" required>
        <UInput
          v-model="state.label"
          placeholder="you@example.com"
          icon="i-heroicons-envelope"
          name="email"
          required
        />
      </UFormGroup>
      <div class="flex w-full justify-end space-x-4 mt-4 p-2 relative">
        <UButton
          @click="modal.close()"
          label="Cancel"
          variant="ghost"
          size="xl"
        />
        <UButton :disabled="loading" type="submit" size="xl">Save</UButton>
      </div>
    </form>
  </UModal>
</template>

<script setup lang="ts">
import { AccountEditSchema, type Account } from "~/types";
import { toast } from "@steveyuowo/vue-hot-toast";
import AccountIcon from "./AccountIcon.vue";

const props = defineProps<{
  account: Account;
}>();

const state = reactive({ ...props.account });

const iconQuery = ref("");

const modal = useModal();

const loading = ref(false);
const iconsLoading = ref(false);
const selectedSimpleIcons = ref(state.icontype === "simple");

const resetIcontype = () => {
  iconQuery.value = "";
  state.icon = "";
};

const searchIcon = async (query: string) => {
  iconsLoading.value = true;
  const icons = await $fetch<string[]>("/api/icons", {
    params: {
      type: selectedSimpleIcons.value ? "simple" : "normal",
      query: query,
    },
  });
  iconsLoading.value = false;
  return icons;
};

const edit = async () => {
  state.icontype = selectedSimpleIcons.value ? "simple" : "normal";
  loading.value = true;
  const toastId = toast.loading("Loading...");
  const postdata = AccountEditSchema.parse(state);
  await $fetch(`/api/accounts/${state.id}`, {
    method: "PATCH",
    body: postdata,
  })
    .then(async (data) => {
      toast.update(toastId, {
        type: "success",
        message: "Edited successfully",
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
  loading.value = false;
};
</script>
