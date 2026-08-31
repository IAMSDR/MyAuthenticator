<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import { toast } from "@steveyuowo/vue-hot-toast";
import { ensureOnline } from "~/utils/offline";

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
  if (!ensureOnline("save this authenticator")) return;
  loading.value = true;
  const toastid = toast.loading("Saving...");
  const { dek } = useEncryption();
  if (!dek.value) {
    toast.update(toastid, { message: "Vault locked: please login", type: "error" });
    loading.value = false;
    return;
  }
  const cipherSecret = await encryptWithKey(event.data.secret, dek.value);
  const cipherAccount: CipherAccount = {
    ...event.data,
    id: crypto.randomUUID(),
    secret: cipherSecret,
    createdAt: new Date().toISOString(),
  } as CipherAccount;

  await $fetch("/api/accounts", {
    method: "POST",
    body: [cipherAccount],
  })
    .then(async (res) => {
      toast.update(toastid, {
        message: (res as any).message,
        type: "success",
      });
      await refreshNuxtData("accounts");
      emit("close");
    })
    .catch((err) => {
      toast.update(toastid, {
        message: err?.data?.message ?? String(err),
        type: "error",
      });
      console.error(err);
    });
  loading.value = false;
}

async function onError(event: FormErrorEvent) {
  toast.error(event.errors[0]?.message ?? "Validation error");
}

watch(searchIssuerDebounced, async (query) => {
  icons.value = await getIcons(query);
});
</script>

<template>
  <UModal title="Setup using key" description="Enter secret key manually">
    <template #body>
      <UForm
        :schema="accountSchema"
        :state="state"
        class="space-y-4"
        @submit="addAccount"
        @error="onError"
      >
        <UFormField label="Issuer" name="issuer" required>
          <UInputMenu
            v-model="selectedIssuer"
            v-model:search-term="searchIssuer"
            ignore-filter
            :items="icons || []"
            :icon="state.icon"
            placeholder="Google, GitHub, etc."
            size="md"
            required
            :ui="{ base: 'h-10' }"
            @update:model-value="updateIssuerAndIcon"
          >
            <template #empty>Type something to search</template>
          </UInputMenu>
        </UFormField>

        <UFormField label="Label / Account name" name="label" required>
          <UInput
            v-model="state.label"
            placeholder="name@example.com"
            size="md"
            required
            icon="i-heroicons-envelope"
            :ui="{ base: 'h-10' }"
          />
        </UFormField>

        <UFormField label="Type" name="type" required>
          <USelect v-model="state.type" :items="otpTypes" size="md" class="w-full" :ui="{ base: 'h-10' }" />
        </UFormField>

        <UFormField label="Secret Key" name="secret" required>
          <UInput
            v-model="state.secret"
            placeholder="JBSWY3DPEHPK3PXP"
            size="md"
            required
            icon="i-heroicons-key"
            class="font-mono"
            :ui="{ base: 'h-10' }"
          />
        </UFormField>

        <div v-show="!showAdvanced" class="flex-center w-full pt-1">
          <UButton
            class="text-xs font-semibold cursor-pointer"
            variant="ghost"
            color="neutral"
            size="xs"
            @click="showAdvanced = true"
            >Show advanced options</UButton
          >
        </div>

        <div v-show="showAdvanced" class="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <UFormField label="Algorithm" name="algorithm" required>
            <USelect v-model="state.algorithm" :items="algorithms" size="sm" class="w-full" />
          </UFormField>

          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Digits" required>
              <UInput
                v-model.number="state.digits"
                type="number"
                name="digits"
                size="sm"
                required
                min="6"
                max="8"
              />
            </UFormField>

            <UFormField
              v-if="state.type === 'TOTP'"
              label="Period (sec)"
              required
            >
              <UInput
                v-model.number="state.period"
                type="number"
                name="period"
                size="sm"
                required
                min="5"
                max="60"
              />
            </UFormField>

            <UFormField v-else label="Counter" required>
              <UInput
                v-model.number="state.counter"
                type="number"
                name="counter"
                size="sm"
                required
                min="0"
                max="3000"
              />
            </UFormField>
          </div>
        </div>

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
            >Save account</UButton
          >
        </div>
      </UForm>
    </template>
  </UModal>
</template>


