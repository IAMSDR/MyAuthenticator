<template>
  <UModal close="close">
    <UForm
      :schema="AccountSchema"
      :state="state"
      @submit="addAccount"
      @error="onError"
      class="w-full max-w-md flex flex-col items-center"
    >
      <span className="text-lg xs:text-xl font-semibold uppercase mb-4"
        >Setup Using Key</span
      >
      <UFormGroup label="Issuer" required size="xl">
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
          v-model="state.icon"
          v-model:query="state.issuer"
          size="xl"
          required
          name="issuer"
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
      <UFormGroup label="Type" size="xl" required>
        <USelect
          v-model="state.type"
          :options="otpTypes"
          value-attribute="value"
          option-attribute="title"
          name="type"
          required
        />
      </UFormGroup>
      <UFormGroup label="label" size="xl" required>
        <UInput
          v-model="state.label"
          placeholder="you@example.com"
          icon="i-heroicons-envelope"
          name="label"
          required
        />
      </UFormGroup>
      <UFormGroup label="Key" size="xl" required>
        <UInput
          v-model="state.secret"
          placeholder="secret key"
          icon="i-heroicons-key"
          name="secret"
          required
        />
      </UFormGroup>
      <UButton
        v-show="!showAdvanced"
        class="uppercase mt-2 font-mono"
        variant="ghost"
        @click="showAdvanced = true"
        >show advanced</UButton
      >
      <UFormGroup v-show="showAdvanced" label="Algorithm" size="xl" required>
        <USelect
          v-model="state.algorithm"
          :options="algorithms"
          value-attribute="value"
          option-attribute="title"
          name="algorithm"
          required
        />
      </UFormGroup>
      <div v-show="showAdvanced" class="flex-center space-x-3 w-full">
        <UFormGroup label="Digits" size="xl" required>
          <UInput
            name="digits"
            v-model="state.digits"
            type="number"
            icon="i-material-symbols-123"
            required
            min="6"
            max="8"
          />
        </UFormGroup>
        <UFormGroup
          v-if="state.type === 'TOTP'"
          label="Period"
          size="xl"
          required
        >
          <UInput
            name="period"
            v-model="state.period"
            type="number"
            icon="i-material-symbols-timer-outline-rounded"
            required
            min="5"
            max="60"
          />
        </UFormGroup>
        <UFormGroup v-else label="Counter" size="xl" required>
          <UInput
            name="counter"
            v-model="state.counter"
            type="number"
            icon="i-material-symbols-timer-outline-rounded"
            required
            min="0"
            max="3000"
          />
        </UFormGroup>
      </div>
      <div class="flex w-full justify-end space-x-4 mt-4 p-2 relative">
        <UButton
          @click="modal.close()"
          label="Cancel"
          variant="ghost"
          size="xl"
        />
        <UButton :disabled="loading" type="submit" size="xl">Submit</UButton>
      </div>
    </UForm>
  </UModal>
</template>

<script setup lang="ts">
import * as OTPAuth from "otpauth";
import type { FormSubmitEvent, FormErrorEvent } from "#ui/types";
import { AccountSchema, type Account } from "~/types";
import { toast } from "@steveyuowo/vue-hot-toast";
import AccountIcon from "./AccountIcon.vue";

const modal = useModal();

const state = reactive({
  type: "TOTP",
  issuer: "",
  secret: undefined,
  algorithm: "SHA1",
  label: undefined,
  icon: "",
  icontype: "normal",
  digits: 6,
  period: 30,
  counter: 0,
});

const otpTypes = [
  {
    title: "Time Based (TOTP)",
    value: "TOTP",
  },
  {
    title: "Counter Based (HOTP)",
    value: "HOTP",
  },
];

const algorithms = [
  {
    title: "SHA1 (Default)",
    value: "SHA1",
  },
  {
    title: "SHA256",
    value: "SHA512",
  },
  {
    title: "SHA512",
    value: "SHA512",
  },
];

const showAdvanced = ref(false);
const loading = ref(false);
const iconsLoading = ref(false);
const selectedSimpleIcons = ref(false);

const resetIcontype = () => {
  state.issuer = "";
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

const addAccount = async (event: FormSubmitEvent<Account>) => {
  let postdata = event.data;
  postdata.icontype = selectedSimpleIcons.value ? "simple" : "normal";
  if (postdata.issuer) {
    postdata.icon = "default";
    postdata.icontype = "normal";
  } else postdata.issuer = postdata.icon;
  const toastId = toast.loading("Loading...");
  try {
    const OTP =
      postdata.type === "TOTP"
        ? new OTPAuth.TOTP(postdata)
        : new OTPAuth.HOTP(postdata);
  } catch {
    toast.update(toastId, { type: "error", message: "Invalid Secret !" });
    return;
  }
  loading.value = true;
  await $fetch("/api/accounts", {
    method: "POST",
    body: [postdata],
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
      toast.update(toastId, { type: "error", message: err.message });
    });
  loading.value = false;
};

async function onError(event: FormErrorEvent) {
  console.log(event.errors[0]);
  toast.error(event.errors[0].message);
}
</script>
