<script setup lang="ts">
import AdaptiveModal from "./AdaptiveModal.vue";
import { toast } from "~/utils/toast";
import { ensureOnline, getWriteErrorMessage, onlineNow } from "~/utils/offline";
import type { SkippedAccount } from "../../shared/utils";
import {
  accountSchema,
  type Account,
  type Accounts,
  type CipherAccount,
} from "../../shared/types";

const emit = defineEmits(["close"]);

const chosen = ref(0);

const password = ref("");

const file = ref<HTMLInputElement | null>(null);

const loading = ref(false);

interface ProgressLogItem {
  id: string;
  type: "info" | "success" | "warning" | "error";
  text: string;
  detail?: string;
}

const restoreStatus = ref<"idle" | "scanning" | "confirm" | "saving" | "done" | "error">("idle");
const progressCurrent = ref(0);
const progressTotal = ref(0);
const logItems = ref<ProgressLogItem[]>([]);
const parsedValidAccounts = ref<Account[]>([]);
const parsedSkippedAccounts = ref<SkippedAccount[]>([]);
const restoreError = ref("");
const logContainer = ref<HTMLElement | null>(null);

const progressPercent = computed(() => {
  if (!progressTotal.value) return 0;
  return Math.min(100, Math.round((progressCurrent.value / progressTotal.value) * 100));
});

const resetRestoreState = () => {
  restoreStatus.value = "idle";
  progressCurrent.value = 0;
  progressTotal.value = 0;
  logItems.value = [];
  parsedValidAccounts.value = [];
  parsedSkippedAccounts.value = [];
  restoreError.value = "";
  loading.value = false;
};

watch(chosen, () => {
  if (restoreStatus.value !== "idle") {
    resetRestoreState();
  }
});

const appendLog = async (type: ProgressLogItem["type"], text: string, detail?: string) => {
  logItems.value.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    text,
    detail,
  });
  await nextTick();
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight;
  }
};

const handleChosen = (val: number) => {
  if (chosen.value > 0 && val === chosen.value) chosen.value = 0;
  else chosen.value = val;
  password.value = "";
  if (file.value) file.value.value = "";
  file.value = null;
  resetRestoreState();
};

const downloadEncryptedBackupFile = async () => {
  const toastId = toast.loading("Downloading...");
  loading.value = true;
  const raw = useNuxtData<CipherAccount[]>("accounts");
  if (!raw.data.value?.length) {
    toast.error("No accounts to backup", { id: toastId });
    loading.value = false;
    return;
  }
  const { dek, decryptAccounts } = useEncryption();
  if (!dek.value) {
    toast.error("Vault locked", { id: toastId });
    loading.value = false;
    return;
  }
  let plain: Accounts = [];
  try {
    plain = await decryptAccounts(raw.data.value as CipherAccount[]);
  } catch {
    toast.error("Failed to decrypt accounts", { id: toastId });
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
    toast.success("Download successful", { id: toastId });
  } catch (error) {
    toast.error("Download failed", { id: toastId });
    console.error("Error downloading backup file:", error);
  }
  loading.value = false;
};

const downloadUriListFile = async () => {
  const toastId = toast.loading("Downloading...");
  loading.value = true;
  const raw = useNuxtData<CipherAccount[]>("accounts");
  if (!raw.data.value?.length) {
    toast.error("No accounts to backup", { id: toastId });
    loading.value = false;
    return;
  }
  const { dek, decryptAccounts } = useEncryption();
  if (!dek.value) {
    toast.error("Vault locked", { id: toastId });
    loading.value = false;
    return;
  }
  let plain: Accounts = [];
  try {
    plain = await decryptAccounts(raw.data.value as CipherAccount[]);
  } catch {
    toast.error("Failed to decrypt accounts", { id: toastId });
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
    toast.success("Download successful", { id: toastId });
  } catch (error) {
    toast.error("Download failed", { id: toastId });
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
  const selectedFile = file.value.files[0];
  const pwd = password.value;
  resetRestoreState();
  restoreStatus.value = "scanning";
  loading.value = true;

  await appendLog("info", `Reading encrypted backup: ${selectedFile.name}...`);
  let fileContent = "";
  try {
    fileContent = await readFileContent(selectedFile);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to read file";
    await appendLog("error", msg);
    restoreError.value = msg;
    restoreStatus.value = "error";
    loading.value = false;
    return;
  }

  await appendLog("info", "Decrypting backup file with password...");
  let parsedRaw: unknown;
  try {
    const decrypted = await decryptWithPassword(fileContent, pwd);
    parsedRaw = JSON.parse(decrypted);
  } catch (err) {
    console.error("Error decrypting backup:", err);
    await appendLog("error", "Failed to decrypt: Incorrect password or invalid backup file.");
    restoreError.value = "Invalid backup file or incorrect password";
    restoreStatus.value = "error";
    loading.value = false;
    return;
  }

  if (!Array.isArray(parsedRaw)) {
    await appendLog("error", "Invalid backup format: Content is not an array of accounts.");
    restoreError.value = "Invalid backup format";
    restoreStatus.value = "error";
    loading.value = false;
    return;
  }

  progressTotal.value = parsedRaw.length;
  progressCurrent.value = 0;
  await appendLog("info", `Decrypted ${parsedRaw.length} accounts. Verifying schemas...`);

  const validAccounts: Account[] = [];
  const skippedAccounts: SkippedAccount[] = [];

  for (let i = 0; i < parsedRaw.length; i++) {
    const item = parsedRaw[i];
    progressCurrent.value = i + 1;
    const validated = accountSchema.safeParse(item);

    if (validated.success) {
      validAccounts.push(validated.data);
      const name = [validated.data.issuer, validated.data.label].filter(Boolean).join(" - ");
      await appendLog("success", `[#${i + 1}] Valid: ${name}`);
    } else {
      const reason = validated.error.issues.map((iss) => iss.message).join(", ") || "Validation failed";
      const itemLabel = item?.label || item?.issuer || `Account #${i + 1}`;
      const skippedItem: SkippedAccount = {
        line: i + 1,
        label: itemLabel,
        reason,
      };
      skippedAccounts.push(skippedItem);
      await appendLog("warning", `[#${i + 1}] Invalid: ${itemLabel}`, reason);
    }
    await nextTick();
  }

  parsedValidAccounts.value = validAccounts;
  parsedSkippedAccounts.value = skippedAccounts;

  if (!validAccounts.length) {
    await appendLog("error", "No valid authenticators found in backup.");
    restoreError.value = "No valid authenticators found in backup file";
    restoreStatus.value = "error";
    loading.value = false;
    return;
  }

  if (skippedAccounts.length > 0) {
    await appendLog(
      "warning",
      `Verification finished with warnings: ${validAccounts.length} valid, ${skippedAccounts.length} invalid item(s).`
    );
  } else {
    await appendLog("success", `Verification finished: All ${validAccounts.length} authenticators verified!`);
  }

  restoreStatus.value = "confirm";
  loading.value = false;
};

const restoreFromUriListFile = async () => {
  if (!ensureOnline("restore")) return;
  if (!file.value?.files?.[0]) {
    toast.error("No file selected");
    return;
  }

  const selectedFile = file.value.files[0];
  resetRestoreState();
  restoreStatus.value = "scanning";
  loading.value = true;

  await appendLog("info", `Reading file: ${selectedFile.name}...`);
  let fileContent = "";
  try {
    fileContent = await readFileContent(selectedFile);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to read file";
    await appendLog("error", msg);
    restoreError.value = msg;
    restoreStatus.value = "error";
    loading.value = false;
    return;
  }

  const rawLines = fileContent.split(/\r?\n/);
  const meaningfulLines = rawLines.filter((l) => {
    const t = l.trim();
    return t && !t.startsWith("#");
  });

  if (!meaningfulLines.length) {
    await appendLog("error", "File contains no authenticator lines.");
    restoreError.value = "File is empty or contains no authenticators";
    restoreStatus.value = "error";
    loading.value = false;
    return;
  }

  progressTotal.value = rawLines.length;
  progressCurrent.value = 0;

  await appendLog("info", `Found ${meaningfulLines.length} candidate lines. Starting verification...`);

  const { accounts, skipped } = await extractAccountsFromUriList(
    rawLines,
    async ({ current, total, account, skipped: skippedItem }) => {
      progressCurrent.value = current;
      progressTotal.value = total;

      if (account) {
        const name = [account.issuer, account.label].filter(Boolean).join(" - ");
        await appendLog("success", `[Line ${current}] Valid: ${name}`);
      } else if (skippedItem) {
        await appendLog("warning", `[Line ${current}] Skipped: ${skippedItem.label}`, skippedItem.reason);
      }
      await nextTick();
    }
  );

  parsedValidAccounts.value = accounts;
  parsedSkippedAccounts.value = skipped;

  if (!accounts.length) {
    await appendLog("error", "No valid authenticators found in this file.");
    restoreError.value = skipped[0]?.reason
      ? `No valid authenticators found (e.g. Line ${skipped[0].line}: ${skipped[0].reason})`
      : "No valid authenticators found";
    restoreStatus.value = "error";
    loading.value = false;
    return;
  }

  if (skipped.length > 0) {
    await appendLog(
      "warning",
      `Scan finished with warnings: ${accounts.length} valid, ${skipped.length} invalid line(s).`
    );
  } else {
    await appendLog("success", `Scan finished: All ${accounts.length} authenticator(s) verified successfully!`);
  }

  restoreStatus.value = "confirm";
  loading.value = false;
};

const confirmAndExecuteRestore = async () => {
  const accountsToImport = parsedValidAccounts.value;
  if (!accountsToImport.length) return;

  if (!ensureOnline("restore")) return;

  const { dek } = useEncryption();
  if (!dek.value) {
    toast.error("Vault locked");
    return;
  }

  restoreStatus.value = "saving";
  loading.value = true;
  await appendLog("info", `Encrypting ${accountsToImport.length} accounts with vault master key...`);

  const now = new Date().toISOString();
  let cipher: CipherAccount[] = [];
  try {
    cipher = await Promise.all(
      accountsToImport.map(async (acc) => {
        const { id: _o, ...remain } = acc as Account & { id?: string };
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
    await appendLog("error", "Encryption failed with vault key.");
    toast.error("Encryption failed");
    loading.value = false;
    restoreStatus.value = "error";
    return;
  }

  await appendLog("info", "Syncing encrypted accounts with server...");
  const { data: accountsData } = useNuxtData<CipherAccount[]>("accounts");
  if (accountsData.value) {
    accountsData.value = [...cipher, ...accountsData.value];
  }

  try {
    const res = await $fetch<{ status: number; message: string; version: number }>("/api/accounts", {
      method: "POST",
      body: cipher,
    });

    await appendLog("success", `✓ Server sync complete: ${res.message || "Restored successfully"}`);
    await upsertCachedAccounts(cipher, res.version, now);

    const skippedCount = parsedSkippedAccounts.value.length;
    if (skippedCount > 0) {
      toast.success(`Imported ${accountsToImport.length} accounts (${skippedCount} skipped)`);
      console.table(
        parsedSkippedAccounts.value.map((s) => ({
          Line: s.line,
          Account: s.label,
          Reason: s.reason,
        }))
      );
    } else {
      toast.success(res.message || "Restored successfully");
    }

    restoreStatus.value = "done";
    loading.value = false;

    setTimeout(() => {
      emit("close");
    }, 1200);
  } catch (err) {
    const errorMsg = getWriteErrorMessage(err, "restore");
    await appendLog("error", `Failed to save accounts: ${errorMsg}`);
    toast.error(errorMsg);

    const addedIds = new Set(cipher.map((c) => c.id));
    if (accountsData.value) {
      accountsData.value = accountsData.value.filter((a) => !addedIds.has(a.id));
    }
    if (onlineNow()) await refreshNuxtData("accounts");

    restoreStatus.value = "error";
    restoreError.value = errorMsg;
    loading.value = false;
    console.error(err);
  }
};
</script>

<template>
  <AdaptiveModal
    :title="restoreStatus === 'idle' ? 'Backup & Restore' : 'Restore Authenticators'"
    :description="restoreStatus === 'idle' ? 'Export or import your encrypted authenticators' : 'Live verification and vault sync progress'"
  >
    <template #body>
      <!-- Mode 1: Option Selector (Idle) -->
      <div v-if="restoreStatus === 'idle'" class="space-y-3">
        <!-- Option 1: Backup Encrypted -->
        <div class="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden transition-colors">
          <button
            class="w-full flex items-center justify-between p-3.5 bg-neutral-50/50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors cursor-pointer"
            @click="handleChosen(1)"
          >
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-shield-check" class="size-5 text-(--ui-primary)" />
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
              <UIcon name="i-lucide-file-text" class="size-5 text-(--ui-primary)" />
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
              <UIcon name="i-lucide-shield-check" class="size-5 text-neutral-600 dark:text-neutral-400" />
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
                  id="backup-file-input"
                  type="file"
                  required
                  class="w-full text-xs text-neutral-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 dark:file:bg-neutral-800 file:text-neutral-900 dark:file:text-neutral-100 hover:file:bg-neutral-200 dark:hover:file:bg-neutral-700 file:transition-colors cursor-pointer"
                  @change="file = ($event.target as HTMLInputElement)"
                >
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
              <UIcon name="i-lucide-file-up" class="size-5 text-neutral-600 dark:text-neutral-400" />
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
                  id="uri-list-file-input"
                  type="file"
                  required
                  class="w-full text-xs text-neutral-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 dark:file:bg-neutral-800 file:text-neutral-900 dark:file:text-neutral-100 hover:file:bg-neutral-200 dark:hover:file:bg-neutral-700 file:transition-colors cursor-pointer"
                  @change="file = ($event.target as HTMLInputElement)"
                >
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

      <!-- Mode 2: Live Progress & Decision Console -->
      <div v-else class="space-y-4">
        <!-- Status Bar & Progress -->
        <div class="space-y-1.5">
          <div class="flex justify-between items-center text-xs text-neutral-600 dark:text-neutral-400">
            <div class="flex items-center gap-2">
              <UIcon
                v-if="restoreStatus === 'scanning' || restoreStatus === 'saving'"
                name="i-lucide-loader-2"
                class="size-3.5 animate-spin text-(--ui-primary)"
              />
              <UIcon
                v-else-if="restoreStatus === 'confirm' && parsedSkippedAccounts.length > 0"
                name="i-lucide-alert-triangle"
                class="size-3.5 text-amber-500"
              />
              <UIcon
                v-else-if="restoreStatus === 'confirm' || restoreStatus === 'done'"
                name="i-lucide-check-circle"
                class="size-3.5 text-emerald-500"
              />
              <UIcon
                v-else-if="restoreStatus === 'error'"
                name="i-lucide-x-circle"
                class="size-3.5 text-rose-500"
              />
              <span class="font-medium text-neutral-900 dark:text-neutral-100">
                {{
                  restoreStatus === 'scanning'
                    ? 'Verifying Authenticators...'
                    : restoreStatus === 'confirm'
                    ? 'Review Verification Results'
                    : restoreStatus === 'saving'
                    ? 'Saving to Vault...'
                    : restoreStatus === 'done'
                    ? 'Restore Completed'
                    : 'Restore Error'
                }}
              </span>
            </div>
            <span v-if="progressTotal > 0" class="font-mono font-medium">
              {{ progressCurrent }}/{{ progressTotal }} ({{ progressPercent }}%)
            </span>
          </div>

          <!-- Progress bar -->
          <div class="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              class="h-full transition-all duration-200 ease-out"
              :class="
                restoreStatus === 'done'
                  ? 'bg-emerald-500'
                  : restoreStatus === 'error'
                  ? 'bg-rose-500'
                  : restoreStatus === 'confirm' && parsedSkippedAccounts.length > 0
                  ? 'bg-amber-500'
                  : 'bg-(--ui-primary)'
              "
              :style="{ width: `${progressPercent}%` }"
            />
          </div>
        </div>

        <!-- Terminal Console Log Window -->
        <div class="rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden shadow-inner">
          <div class="flex items-center justify-between px-3 py-1.5 bg-neutral-900/90 border-b border-neutral-800 text-[11px] text-neutral-400">
            <div class="flex items-center gap-1.5">
              <span class="size-2 rounded-full bg-rose-500/80 inline-block" />
              <span class="size-2 rounded-full bg-amber-500/80 inline-block" />
              <span class="size-2 rounded-full bg-emerald-500/80 inline-block" />
              <span class="ml-2 font-mono text-[10px] text-neutral-400">authenticator-restore.log</span>
            </div>
            <span class="text-[10px] text-neutral-500">{{ logItems.length }} events</span>
          </div>
          <div
            ref="logContainer"
            class="font-mono text-xs p-3 max-h-52 min-h-36 overflow-y-auto space-y-1.5 select-text"
          >
            <div
              v-for="item in logItems"
              :key="item.id"
              class="flex items-start gap-2 leading-relaxed transition-opacity duration-150"
              :class="{
                'text-emerald-400': item.type === 'success',
                'text-amber-400': item.type === 'warning',
                'text-rose-400': item.type === 'error',
                'text-neutral-400': item.type === 'info',
              }"
            >
              <UIcon
                :name="
                  item.type === 'success'
                    ? 'i-lucide-check-circle'
                    : item.type === 'warning'
                    ? 'i-lucide-alert-triangle'
                    : item.type === 'error'
                    ? 'i-lucide-x-circle'
                    : 'i-lucide-terminal'
                "
                class="size-3.5 mt-0.5 shrink-0"
              />
              <div class="flex-1 min-w-0">
                <div class="break-all">{{ item.text }}</div>
                <div v-if="item.detail" class="text-[10px] text-neutral-400 mt-0.5 break-words">
                  Reason: {{ item.detail }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Confirm / Decision Panel -->
        <div v-if="restoreStatus === 'confirm'" class="space-y-3">
          <!-- Warnings info if some lines skipped -->
          <div
            v-if="parsedSkippedAccounts.length > 0"
            class="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-300 space-y-2"
          >
            <div class="flex items-start gap-2 font-medium">
              <UIcon name="i-lucide-alert-circle" class="size-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <span>Found </span>
                <strong class="font-semibold text-amber-900 dark:text-amber-200">{{ parsedValidAccounts.length }}</strong>
                <span> valid authenticators and </span>
                <strong class="font-semibold text-amber-900 dark:text-amber-200">{{ parsedSkippedAccounts.length }}</strong>
                <span> invalid line(s).</span>
              </div>
            </div>

            <details class="cursor-pointer text-[11px] text-neutral-600 dark:text-neutral-300 pt-1">
              <summary class="font-medium hover:underline text-amber-700 dark:text-amber-400">
                Show {{ parsedSkippedAccounts.length }} skipped item details
              </summary>
              <div class="mt-2 max-h-32 overflow-y-auto space-y-1.5 pl-2 border-l-2 border-amber-500/40 font-mono">
                <div v-for="sk in parsedSkippedAccounts" :key="sk.line" class="flex flex-col">
                  <span class="text-neutral-900 dark:text-neutral-100 font-semibold">Line {{ sk.line }}: {{ sk.label }}</span>
                  <span class="text-rose-600 dark:text-rose-400 text-[10px]">{{ sk.reason }}</span>
                </div>
              </div>
            </details>
          </div>

          <!-- Success info if all valid -->
          <div
            v-else
            class="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2"
          >
            <UIcon name="i-lucide-check-circle" class="size-4 shrink-0 text-emerald-500" />
            <span>All <strong>{{ parsedValidAccounts.length }}</strong> authenticators verified and ready to import.</span>
          </div>

          <div class="flex gap-2 pt-1">
            <UButton
              variant="outline"
              color="neutral"
              size="md"
              class="flex-1 h-10 cursor-pointer justify-center"
              @click="resetRestoreState"
            >
              Cancel
            </UButton>
            <UButton
              color="primary"
              size="md"
              class="flex-1 h-10 cursor-pointer justify-center"
              :loading="loading"
              :disabled="loading"
              @click="confirmAndExecuteRestore"
            >
              {{ parsedSkippedAccounts.length > 0 ? `Import ${parsedValidAccounts.length} Valid` : `Import All (${parsedValidAccounts.length})` }}
            </UButton>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="restoreStatus === 'error'" class="space-y-3">
          <div class="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
            <UIcon name="i-lucide-alert-circle" class="size-4 shrink-0 mt-0.5 text-rose-500" />
            <span class="font-medium">{{ restoreError || "Restore failed" }}</span>
          </div>
          <UButton
            variant="outline"
            color="neutral"
            size="md"
            block
            class="h-10 cursor-pointer justify-center"
            @click="resetRestoreState"
          >
            Back
          </UButton>
        </div>

        <!-- Scanning Active -->
        <div v-else-if="restoreStatus === 'scanning'" class="flex justify-between items-center pt-1 text-xs text-neutral-500">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-loader-2" class="size-3.5 animate-spin text-(--ui-primary)" />
            <span>Scanning and verifying accounts...</span>
          </div>
          <UButton
            variant="ghost"
            color="neutral"
            size="xs"
            class="cursor-pointer"
            @click="resetRestoreState"
          >
            Cancel
          </UButton>
        </div>

        <!-- Saving Active -->
        <div v-else-if="restoreStatus === 'saving'" class="flex items-center gap-2 pt-1 text-xs text-neutral-500">
          <UIcon name="i-lucide-loader-2" class="size-3.5 animate-spin text-(--ui-primary)" />
          <span>Encrypting and syncing accounts with vault...</span>
        </div>

        <!-- Done -->
        <div v-else-if="restoreStatus === 'done'" class="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <UIcon name="i-lucide-check-circle" class="size-4 shrink-0 text-emerald-500" />
          <span class="font-medium">Import completed successfully! Closing...</span>
        </div>
      </div>
    </template>
  </AdaptiveModal>
</template>


