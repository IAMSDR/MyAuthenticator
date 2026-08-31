<script setup lang="ts">
import { getCache, cacheAccountsFromServer } from "~/utils/cache";
import { onlineNow } from "~/utils/offline";
import BackgroundPattern from "~/components/BackgroundPattern.vue";
import AppNavbar from "~/components/AppNavbar.vue";
import BottomBar from "~/components/BottomBar.vue";

const { dek, decryptAccounts } = useEncryption();
const { setOfflineState } = useOffline();

const sortByOrder = (accounts: CipherAccount[], order?: string[]) => {
  const arr = [...accounts];
  if (order?.length) arr.sort((a, b) => order!.indexOf(a.id) - order!.indexOf(b.id));
  return arr;
};

const { data: cipherData, status } = await useAsyncData<CipherAccount[]>("accounts", async () => {
  if (import.meta.server) return [] as CipherAccount[];
  const cached = await getCache();
  if (!onlineNow()) {
    setOfflineState(true);
    if (cached && Object.keys(cached.map).length) return sortByOrder(Object.values(cached.map) as CipherAccount[], cached.order);
    return [] as CipherAccount[];
  }
  try {
    const meta = await $fetch<{ version: number; updatedAt: string; count: number; order?: string[] }>("/api/accounts/meta");
    if (cached && cached.version === meta.version && Object.keys(cached.map).length === meta.count) {
      setOfflineState(false);
      return sortByOrder(Object.values(cached.map) as CipherAccount[], meta.order ?? cached.order);
    }
    const fresh = await $fetch<CipherAccount[]>("/api/accounts");
    const order = Array.isArray(meta.order) && meta.order.length ? meta.order : undefined;
    await cacheAccountsFromServer(fresh, { version: meta.version, updatedAt: meta.updatedAt }, order);
    setOfflineState(false);
    return sortByOrder(fresh, order);
  } catch {
    setOfflineState(true);
    if (cached && Object.keys(cached.map).length) return sortByOrder(Object.values(cached.map) as CipherAccount[], cached.order);
    return [] as CipherAccount[];
  }
}, { server: false, default: () => [] as CipherAccount[] });

const decrypted = ref<Account[]>([]);
const decryptError = ref<string | null>(null);

watch([cipherData, dek], async () => {
  if (!cipherData.value?.length) {
    decrypted.value = [];
    decryptError.value = null;
    return;
  }
  if (!dek.value) {
    decryptError.value = "Vault locked. Please login to decrypt.";
    decrypted.value = [];
    return;
  }
  try {
    decrypted.value = await decryptAccounts(cipherData.value);
    decryptError.value = null;
  } catch (e) {
    decryptError.value = String(e);
  }
}, { immediate: true, deep: true });

const searchQuery = useState("searchQuery", () => "");
const showSearchBar = useState("searchBar", () => false);

const accounts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return decrypted.value;
  return decrypted.value.filter((item) =>
    (item.label && item.label.toLowerCase().includes(query)) ||
    (item.issuer && item.issuer.toLowerCase().includes(query))
  );
});
</script>

<template>
  <div class="relative min-h-screen flex flex-col">
    <!-- Clean Dot Grid Texture without Cursor Glow -->
    <BackgroundPattern />

    <!-- Sleek Desktop Header & Top Navbar -->
    <AppNavbar />

    <main class="flex-1 w-full pb-24 md:pb-12">
      <UContainer class="py-6">
        <!-- Mobile Dropdown Search Field (Active when toggled on mobile) -->
        <Transition name="slidey">
          <div v-if="showSearchBar" class="md:hidden mb-4">
            <Search v-model:modal-value="searchQuery" />
          </div>
        </Transition>

        <!-- Empty State -->
        <div
          v-if="!cipherData?.length && status === 'success' && !decryptError"
          class="min-h-[50vh] flex flex-col items-center justify-center space-y-3 text-center"
        >
          <div class="size-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
            <UIcon name="i-heroicons-inbox-stack" class="size-8" />
          </div>
          <h2 class="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">No accounts stored yet</h2>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm">
            Please use the plus button to add your first authenticator account.
          </p>
        </div>

        <!-- Locked Vault State -->
        <div
          v-else-if="decryptError"
          class="min-h-[50vh] flex flex-col items-center justify-center space-y-3 p-4 text-center"
        >
          <div class="size-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <UIcon name="i-lucide-lock" class="size-7" />
          </div>
          <h2 class="text-base font-bold text-neutral-900 dark:text-neutral-100">Vault locked</h2>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs">{{ decryptError }}</p>
          <UButton to="/login" variant="soft" size="sm">Go to login</UButton>
        </div>

        <!-- Responsive Spacious Accounts Grid -->
        <div
          v-else
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
        >
          <Tile v-for="account in accounts" :key="account.id" :account="account" />
        </div>
      </UContainer>
    </main>

    <!-- Mobile Floating Bottom Navigation -->
    <BottomBar />
  </div>
</template>
