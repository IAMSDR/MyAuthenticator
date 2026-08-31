<script setup lang="ts">
import AdaptiveModal from "./AdaptiveModal.vue";
import { toast } from "@steveyuowo/vue-hot-toast";
import { ensureOnline } from "~/utils/offline";

const emit = defineEmits(["close"]);

const chosen = ref(0);

const password = ref("");

const file = ref<HTMLInputElement | null>(null);

const loading = ref(false);

const handleChosen = (val: number) => {
  if (chosen.value > 0 && val === chosen.value) chosen.value = 0;
  else chosen.value = val;
  password.value = "";
  if (file.value) file.value.value = "";
  file.value = null;
};

const downloadEncryptedBackupFile = async () => {
  const toastId = toast.loading("Downloading...");
  loading.value = true;
  const raw = useNuxtData<CipherAccount[]>("accounts");
  if (!raw.data.value?.length) {
    toast.update(toastId, {
      message: "No accounts to backup",
      type: "error",
    });
    loading.value = false;
    return;
  }
  const { dek, decryptAccounts } = useEncryption();
  if (!dek.value) {
    toast.update(toastId, { message: "Vault locked", type: "error" });
    loading.value = false;
    return;
  }
  let plain: Accounts = [];
  try {
    plain = await decryptAccounts(raw.data.value as CipherAccount[]);
  } catch {
    toast.update(toastId, { message: "Failed to decrypt accounts", type: "error" });
    loading.value = false;
    return;
  }
  const encryptedAccounts = await encryptWithPassword(
    JSON.stringify(plain),
    password.value
  );
  try {
    const blob = new Blob([encryptedAccounts], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Backup (MyAuthenticator)-${new Date().toISOString()}.backup`;
    link.click();
    URL.revokeObjectURL(url);
    toast.update(toastId, {
      message: "Download successful",
      type: "success",
    });
  } catch (error) {
    toast.update(toastId, {
      message: "Download failed",
      type: "error",
    });
    console.error("Error downloading backup file:", error);
  }
  loading.value = false;
};

const downloadUriListFile = async () => {
  const toastId = toast.loading("Downloading...");
  loading.value = true;
  const raw = useNuxtData<CipherAccount[]>("accounts");
  if (!raw.data.value?.length) {
    toast.update(toastId, {
      message: "No accounts to backup",
      type: "error",
    });
    loading.value = false;
    return;
  }
  const { dek, decryptAccounts } = useEncryption();
  if (!dek.value) {
    toast.update(toastId, { message: "Vault locked", type: "error" });
    loading.value = false;
    return;
  }
  let plain: Accounts = [];
  try {
    plain = await decryptAccounts(raw.data.value as CipherAccount[]);
  } catch {
    toast.update(toastId, { message: "Failed to decrypt accounts", type: "error" });
    loading.value = false;
    return;
  }
  const accountsUriList = await getAccountsUriList(plain);
  try {
    const blob = new Blob([accountsUriList.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Backup-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.update(toastId, {
      message: "Download successful",
      type: "success",
    });
  } catch (error) {
    toast.update(toastId, {
      message: "Download failed",
      type: "error",
    });
    console.error("Error downloading URI list file:", error);
  }
  loading.value = false;
};

const restoreFromEncryptedBackupFile = async () => {
  if (!ensureOnline("restore")) return;
  if (!file.value?.files?.[0]) {
    toast.error("No file selected");
    return;
  }
  const toastId = toast.loading("Restoring...");
  loading.value = true;
  const fileContent = await readFileContent(file.value.files[0]);
  let accounts: Accounts = [];
  try {
    const decrypted = await decryptWithPassword(fileContent, password.value);
    accounts = JSON.parse(decrypted) as Accounts;
  } catch (error) {
    console.error("Error decrypting file:", error);
  }
  if (!accounts.length) {
    toast.update(toastId, {
      message: "Invalid file or password",
      type: "error",
    });
    loading.value = false;
    return;
  }
  const { dek } = useEncryption();
  if (!dek.value) {
    toast.update(toastId, { message: "Vault locked", type: "error" });
    loading.value = false;
    return;
  }
  const now = new Date().toISOString();
  let cipher: CipherAccount[] = [];
  try {
    cipher = await Promise.all(
      accounts.map(async (acc) => {
        const { id: _o, ...remain } = acc as any;
        const s = await encryptWithKey(remain.secret, dek.value!);
        return {
          ...remain,
          id: crypto.randomUUID(),
          secret: s,
          createdAt: now,
        } as CipherAccount;
      })
    );
  } catch {
    toast.update(toastId, { message: "Encryption failed", type: "error" });
    loading.value = false;
    return;
  }

  const { data: accountsData } = useNuxtData<CipherAccount[]>("accounts");
  if (accountsData.value) {
    accountsData.value = [...cipher, ...accountsData.value];
  }

  emit("close");
  loading.value = false;

  $fetch<{ status: number; message: string; version: number }>("/api/accounts", {
    method: "POST",
    body: cipher,
  })
    .then(async (res) => {
      toast.update(toastId, {
        message: res.message || "Restored successfully",
        type: "success",
      });
      await upsertCachedAccounts(cipher, res.version, now);
    })
    .catch(async (err) => {
      toast.update(toastId, {
        message: err?.data?.message ?? String(err),
        type: "error",
      });
      const addedIds = new Set(cipher.map((c) => c.id));
      if (accountsData.value) {
        accountsData.value = accountsData.value.filter((a) => !addedIds.has(a.id));
      }
      await refreshNuxtData("accounts");
      console.error(err);
    });
};

const restoreFromUriListFile = async () => {
  if (!ensureOnline("restore")) return;
  if (!file.value?.files?.[0]) {
    toast.error("No file selected");
    return;
  }
  const toastId = toast.loading("Restoring...");
  loading.value = true;
  const fileContent = await readFileContent(file.value.files[0]);
  const accounts = await extractAccountsFromUriList(fileContent.split("\n"));
  if (!accounts?.length) {
    toast.update(toastId, {
      message: "Invalid file",
      type: "error",
    });
    loading.value = false;
    return;
  }
  const { dek } = useEncryption();
  if (!dek.value) {
    toast.update(toastId, { message: "Vault locked", type: "error" });
    loading.value = false;
    return;
  }
  const now = new Date().toISOString();
  let cipher: CipherAccount[] = [];
  try {
    cipher = await Promise.all(
      accounts.map(async (acc) => {
        const s = await encryptWithKey(acc.secret, dek.value!);
        return {
          ...acc,
          id: crypto.randomUUID(),
          secret: s,
          createdAt: now,
        } as CipherAccount;
      })
    );
  } catch {
    toast.update(toastId, { message: "Encryption failed", type: "error" });
    loading.value = false;
    return;
  }

  const { data: accountsData } = useNuxtData<CipherAccount[]>("accounts");
  if (accountsData.value) {
    accountsData.value = [...cipher, ...accountsData.value];
  }

  emit("close");
  loading.value = false;

  $fetch<{ status: number; message: string; version: number }>("/api/accounts", {
    method: "POST",
    body: cipher,
  })
    .then(async (res) => {
      toast.update(toastId, {
        message: res.message || "Restored successfully",
        type: "success",
      });
      await upsertCachedAccounts(cipher, res.version, now);
    })
    .catch(async (err) => {
      toast.update(toastId, {
        message: err?.data?.message ?? String(err),
        type: "error",
      });
      const addedIds = new Set(cipher.map((c) => c.id));
      if (accountsData.value) {
        accountsData.value = accountsData.value.filter((a) => !addedIds.has(a.id));
      }
      await refreshNuxtData("accounts");
      console.error(err);
    });
};
</script>

<template>
  <AdaptiveModal
    title="Backup & Restore"
    description="Export or import your encrypted authenticators"
  >
    <template #body>
      <div class="space-y-3">
        <!-- Option 1: Backup Encrypted -->
        <div class="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden transition-colors">
          <button
            class="w-full flex items-center justify-between p-3.5 bg-neutral-50/50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors cursor-pointer"
            @click="handleChosen(1)"
          >
            <div class="flex items-center gap-3">
              <UIcon name="i-hugeicons-encrypt" class="size-5 text-primary-600 dark:text-primary-400" />
              <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Export Encrypted Backup</span>
            </div>
            <UIcon
              name="i-lucide-chevron-down"
              class="size-4 text-neutral-400 transition-transform duration-200"
              :class="chosen === 1 ? 'rotate-180' : ''"
            />
          </button>
          <div v-show="chosen === 1" class="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3 bg-white dark:bg-neutral-950">
            <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Saves all your authenticators into a password-protected backup file (AES-GCM).
            </p>
            <form class="flex gap-2" @submit.prevent="downloadEncryptedBackupFile">
              <UInput
                v-model="password"
                placeholder="Backup password (min 8 chars)"
                type="password"
                required
                minlength="8"
                size="md"
                class="flex-1"
                :ui="{ base: 'h-10' }"
              />
              <UButton
                type="submit"
                size="md"
                class="h-10 cursor-pointer px-4"
                :disabled="loading"
                :loading="loading"
              >Download</UButton>
            </form>
          </div>
        </div>

        <!-- Option 2: Backup Plain URIs -->
        <div class="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden transition-colors">
          <button
            class="w-full flex items-center justify-between p-3.5 bg-neutral-50/50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors cursor-pointer"
            @click="handleChosen(2)"
          >
            <div class="flex items-center gap-3">
              <UIcon name="i-prime-list" class="size-5 text-primary-600 dark:text-primary-400" />
              <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Export Plain URI List</span>
            </div>
            <UIcon
              name="i-lucide-chevron-down"
              class="size-4 text-neutral-400 transition-transform duration-200"
              :class="chosen === 2 ? 'rotate-180' : ''"
            />
          </button>
          <div v-show="chosen === 2" class="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3 bg-white dark:bg-neutral-950">
            <p class="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
              Caution: Exporting plain URIs will expose secret keys in unencrypted text format.
            </p>
            <UButton
              variant="soft"
              color="neutral"
              size="md"
              block
              class="h-10 cursor-pointer"
              :disabled="loading"
              @click="downloadUriListFile"
            >Download URIs (.txt)</UButton>
          </div>
        </div>

        <USeparator label="or import" class="my-1" />

        <!-- Option 3: Restore Encrypted -->
        <div class="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden transition-colors">
          <button
            class="w-full flex items-center justify-between p-3.5 bg-neutral-50/50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors cursor-pointer"
            @click="handleChosen(3)"
          >
            <div class="flex items-center gap-3">
              <UIcon name="i-hugeicons-encrypt" class="size-5 text-neutral-600 dark:text-neutral-400" />
              <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Restore Encrypted Backup</span>
            </div>
            <UIcon
              name="i-lucide-chevron-down"
              class="size-4 text-neutral-400 transition-transform duration-200"
              :class="chosen === 3 ? 'rotate-180' : ''"
            />
          </button>
          <div v-show="chosen === 3" class="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3 bg-white dark:bg-neutral-950">
            <form class="space-y-3" @submit.prevent="restoreFromEncryptedBackupFile">
              <UFormField label="Backup file (.backup)">
                <input
                  type="file"
                  required
                  class="w-full text-xs text-neutral-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 dark:file:bg-neutral-800 file:text-neutral-900 dark:file:text-neutral-100 hover:file:bg-neutral-200 cursor-pointer"
                  @change="file = ($event.target as HTMLInputElement)"
                />
              </UFormField>
              <div class="flex gap-2">
                <UInput
                  v-model="password"
                  placeholder="Backup password"
                  type="password"
                  required
                  minlength="8"
                  size="md"
                  class="flex-1"
                  :ui="{ base: 'h-10' }"
                />
                <UButton
                  type="submit"
                  size="md"
                  class="h-10 cursor-pointer px-4"
                  :disabled="loading"
                  :loading="loading"
                >Restore</UButton>
              </div>
            </form>
          </div>
        </div>

        <!-- Option 4: Restore URIs -->
        <div class="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden transition-colors">
          <button
            class="w-full flex items-center justify-between p-3.5 bg-neutral-50/50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors cursor-pointer"
            @click="handleChosen(4)"
          >
            <div class="flex items-center gap-3">
              <UIcon name="i-tabler-restore" class="size-5 text-neutral-600 dark:text-neutral-400" />
              <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Restore from URI Text File</span>
            </div>
            <UIcon
              name="i-lucide-chevron-down"
              class="size-4 text-neutral-400 transition-transform duration-200"
              :class="chosen === 4 ? 'rotate-180' : ''"
            />
          </button>
          <div v-show="chosen === 4" class="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3 bg-white dark:bg-neutral-950">
            <form class="space-y-3" @submit.prevent="restoreFromUriListFile">
              <UFormField label="URI list file (.txt)">
                <input
                  type="file"
                  required
                  class="w-full text-xs text-neutral-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 dark:file:bg-neutral-800 file:text-neutral-900 dark:file:text-neutral-100 hover:file:bg-neutral-200 cursor-pointer"
                  @change="file = ($event.target as HTMLInputElement)"
                />
              </UFormField>
              <UButton
                type="submit"
                size="md"
                block
                class="h-10 cursor-pointer"
                :disabled="loading"
                :loading="loading"
              >Import URIs</UButton>
            </form>
          </div>
        </div>
      </div>
    </template>
  </AdaptiveModal>
</template>


