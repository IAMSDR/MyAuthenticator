<script setup lang="ts">
import { getCache, cacheAccountsFromServer } from "~/utils/cache";
import { onlineNow } from "~/utils/offline";
import BackgroundGlow from "~/components/BackgroundGlow.vue";

const { dek } = useEncryption();
const { isOffline, setOfflineState } = useOffline();

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
    const results: Account[] = [];
    for (const acc of cipherData.value) {
      const plain = await decryptWithKey(acc.secret, dek.value);
      results.push({ ...acc, secret: plain } as Account);
    }
    decrypted.value = results;
    decryptError.value = null;
  } catch (e) {
    decryptError.value = String(e);
  }
}, { immediate: true });

const searchQuery = ref("");

const accounts = computed(() =>
  showSearchBar.value
    ? decrypted.value.filter((item) => {
        const regex = new RegExp(searchQuery.value, "i");
        return regex.test(item.label) || regex.test(item.issuer);
      })
    : decrypted.value
);

// useState
const showSearchBar = useState("searchBar", () => false);
</script>

<template>
  <div class="relative min-h-screen">
    <BackgroundGlow />

    <UContainer class="py-4 pb-24 sm:pb-10">
      <div v-if="isOffline" class="flex justify-center mb-3">
        <UBadge color="warning" variant="subtle" size="xs">
          <UIcon name="i-lucide-wifi-off" class="size-3 mr-1" />
          Offline Mode
        </UBadge>
      </div>

      <Transition name="slidey">
        <Search v-if="showSearchBar" v-model:modal-value="searchQuery" />
      </Transition>

      <div
        v-if="!cipherData?.length && status === 'success' && !decryptError"
        class="min-h-[70vh] flex-center flex-col space-y-2 text-center"
      >
        <UIcon name="i-heroicons-inbox-stack" class="h-10 w-10 text-neutral-400" />
        <span class="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-neutral-100">Nothing here yet.</span>
        <span class="text-sm font-normal text-neutral-500 dark:text-neutral-400"
          >Please use the plus button below to add your first account!</span
        >
      </div>

      <div
        v-else-if="decryptError"
        class="min-h-[70vh] flex-center flex-col space-y-3 p-4 text-center"
      >
        <UIcon name="i-lucide-lock" class="h-10 w-10 text-neutral-400" />
        <span class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Vault locked</span>
        <span class="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs">{{ decryptError }}</span>
        <UButton to="/login" variant="soft" size="md">Go to login</UButton>
      </div>

      <div
        v-else
        class="h-full scroll-smooth w-full grid place-items-center gap-y-6 gap-x-4 mt-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
      >
        <Tile v-for="account in accounts" :key="account.id" :account="account" />
      </div>
    </UContainer>

    <BottomBar />
  </div>
</template>



