<script setup lang="ts">
import AdaptiveModal from "./AdaptiveModal.vue";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import { toast } from "@steveyuowo/vue-hot-toast";
import { ensureOnline, getWriteErrorMessage, onlineNow } from "~/utils/offline";

const emit = defineEmits(["close"]);

const state = reactive<Account>({
  type: "TOTP",
  issuer: "",
  secret: "",
  algorithm: "SHA1",
  label: "",
  icon: defaultIcon,
  digits: 6,
  period: 30,
  counter: 0,
});

const searchIssuer = ref("");
const searchIssuerDebounced = refDebounced(searchIssuer, 300);
const selectedIssuer = ref<{ label: string; icon: string; description?: string }>();

const showAdvanced = ref(false);

const loading = ref(false);
const searchingIcons = ref(false);

const icons = ref<Icon[]>([]);

const updateIssuerAndIcon = (val: Icon | string | undefined) => {
  if (!val) return;
  if (typeof val === "object") {
    state.icon = val.icon || defaultIcon;
    state.issuer = val.label || "";
  } else if (typeof val === "string") {
    state.issuer = val;
  }
};

async function addAccount(event: FormSubmitEvent<Account>) {
  if (!ensureOnline("save this authenticator")) return;
  const { dek } = useEncryption();
  if (!dek.value) {
    toast.error("Vault locked: please login");
    return;
  }
  loading.value = true;
  const now = new Date().toISOString();
  let cipherSecret = "";
  try {
    cipherSecret = await encryptWithKey(event.data.secret, dek.value);
  } catch (err) {
    toast.error("Encryption failed");
    loading.value = false;
    return;
  }

  const cipherAccount: CipherAccount = {
    ...event.data,
    id: crypto.randomUUID(),
    secret: cipherSecret,
    createdAt: now,
  } as CipherAccount;

  // Optimistically update memory so dashboard reflects change immediately
  const { data: accountsData } = useNuxtData<CipherAccount[]>("accounts");
  if (accountsData.value) {
    accountsData.value = [cipherAccount, ...accountsData.value];
  }

  // Dismiss modal immediately for instant UI feedback
  emit("close");
  loading.value = false;

  const toastid = toast.loading("Saving...");
  $fetch<{ status: number; message: string; version: number }>("/api/accounts", {
    method: "POST",
    body: [cipherAccount],
  })
    .then(async (res) => {
      toast.update(toastid, {
        message: res.message || "Added successfully",
        type: "success",
      });
      await upsertCachedAccounts([cipherAccount], res.version, now);
    })
    .catch(async (err) => {
      toast.update(toastid, {
        message: getWriteErrorMessage(err, "save this authenticator"),
        type: "error",
      });
      // Rollback on failure
      if (accountsData.value) {
        accountsData.value = accountsData.value.filter((a) => a.id !== cipherAccount.id);
      }
      if (onlineNow()) await refreshNuxtData("accounts");
      console.error(err);
    });
}

async function onError(event: FormErrorEvent) {
  toast.error(event.errors[0]?.message ?? "Validation error");
}

watch(searchIssuerDebounced, async (query) => {
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
  <AdaptiveModal title="Setup using key" description="Enter secret key manually">
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
            :loading="searchingIcons"
            placeholder="Search issuer (e.g. Google, GitHub)"
            size="md"
            required
            class="w-full"
            :ui="{ base: 'h-10' }"
            @update:model-value="updateIssuerAndIcon"
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
              <span v-else-if="searchIssuer">No icons found for "{{ searchIssuer }}"</span>
              <span v-else>Type to search brand or icon</span>
            </template>
          </UInputMenu>
        </UFormField>

        <UFormField label="Label / Account name" name="label" required>
          <UInput
            v-model="state.label"
            placeholder="name@example.com"
            size="md"
            required
            icon="i-lucide-mail"
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
            icon="i-lucide-key-round"
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

        <div v-show="showAdvanced" class="p-3.5 rounded-xl bg-neutral-100/60 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/60 space-y-3">
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
  </AdaptiveModal>
</template>


