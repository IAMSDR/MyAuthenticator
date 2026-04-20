<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import { toast } from "@steveyuowo/vue-hot-toast";

const emit = defineEmits(["close"]);

const state = reactive<Account>({
  type: "TOTP",
  issuer: "",
  secret: "",
  algorithm: "SHA1",
  label: "",
  icon: "i-simple-icons-google",
  digits: 6,
  period: 30,
  counter: 0,
});

const searchIssuer = ref("");
const searchIssuerDebounced = refDebounced(searchIssuer, 300);
const selectedIssuer = ref<{ label: string; icon: string }>();

const showAdvanced = ref(false);

const loading = ref(false);

const icons = ref<Icon[]>([]);

const updateIssuerAndIcon = () => {
  if (!selectedIssuer.value) return;
  state.icon = selectedIssuer.value.icon;
  state.issuer = selectedIssuer.value.label;
};

async function addAccount(event: FormSubmitEvent<Account>) {
  loading.value = true;
  const toastid = toast.loading("loading...");
  await $fetch("/api/accounts", {
    method: "POST",
    body: [event.data],
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

watch(searchIssuerDebounced, async (query) => {
  icons.value = await getIcons(query);
});
</script>

<template>
  <UModal title="Setup Using Key" :close="false" :dismissible="false">
    <template #body>
      <UForm
        :schema="accountSchema"
        :state="state"
        @submit="addAccount"
        @error="onError"
      >
        <UFormField size="xl" label="Issuer" name="issuer" required>
          <UInputMenu
            v-model:search-term="searchIssuer"
            v-model="selectedIssuer"
            ignore-filter
            :items="icons || []"
            :icon="state.icon"
            placeholder="Google"
            size="xl"
            required
            @update:model-value="updateIssuerAndIcon"
          >
            <template #empty>Type something to search</template>
          </UInputMenu>
        </UFormField>
        <UFormField size="xl" label="Label" name="label" required>
          <UInput
            v-model="state.label"
            size="xl"
            required
            icon="i-heroicons-envelope"
          />
        </UFormField>
        <UFormField size="xl" label="Type" name="type" required>
          <USelect v-model="state.type" size="xl" :items="otpTypes" />
        </UFormField>
        <UFormField size="xl" label="Key" name="secret" required>
          <UInput
            v-model="state.secret"
            size="xl"
            required
            icon="i-heroicons-key"
          />
        </UFormField>
        <div v-show="!showAdvanced" class="flex-center w-full">
          <UButton
            class="uppercase mx-auto text-xs font-bold font-mono text-(--ui-primary)/70"
            variant="ghost"
            @click="showAdvanced = true"
            >show advanced</UButton
          >
        </div>
        <UFormField
          v-show="showAdvanced"
          size="xl"
          label="Algorithm"
          name="algorithm"
          required
        >
          <USelect v-model="state.algorithm" size="xl" :items="algorithms" />
        </UFormField>
        <div v-show="showAdvanced" class="flex-center space-x-3 w-full">
          <UFormField label="Digits" size="xl" required>
            <UInput
              v-model="state.digits"
              name="digits"
              type="number"
              icon="i-material-symbols-123"
              required
              min="6"
              max="8"
            />
          </UFormField>
          <UFormField
            v-if="state.type === 'TOTP'"
            label="Period"
            size="xl"
            required
          >
            <UInput
              v-model="state.period"
              name="period"
              type="number"
              icon="i-material-symbols-timer-outline-rounded"
              required
              min="5"
              max="60"
            />
          </UFormField>
          <UFormField v-else label="Counter" size="xl" required>
            <UInput
              v-model="state.counter"
              name="counter"
              type="number"
              icon="i-material-symbols-timer-outline-rounded"
              required
              min="0"
              max="3000"
            />
          </UFormField>
        </div>
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
