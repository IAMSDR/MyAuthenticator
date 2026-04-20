<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

const { data, status } = await useLazyFetch("/api/accounts", {
  key: "accounts",
  server: false,
});

const searchQuery = ref("");

const accounts = computed(() =>
  showSearchBar.value
    ? data.value?.filter((item) => {
        const regex = new RegExp(searchQuery.value, "i");
        return regex.test(item.label) || regex.test(item.issuer);
      })
    : data.value
);

// useState
const showSearchBar = useState("searchBar", () => false);
</script>

<template>
  <div>
    <Transition name="slidey">
      <Search v-if="showSearchBar" v-model:modal-value="searchQuery" />
    </Transition>
    <div
      v-if="!data?.length && status === 'success'"
      class="h-dvh overflow-hidden flex-center flex-col space-y-2"
    >
    <UIcon name="i-heroicons-inbox-stack" class="h-8 w-8" />
    <span class="text-lg sm:text-xl font-semibold">Nothing here yet.</span>
    <span class="text-sm font-normal text-neutral-400"
      >Please use the button below to add something !</span
    >
  </div>
    <div
      v-else
      class="h-full scroll-smooth w-full grid place-items-center gap-y-10 gap-x-4 mt-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 pb-20 sm:pb-10"
    >
      <Tile v-for="account in accounts" :key="account.id" :account="account" />
    </div>
    <BottomBar />
  </div>
</template>
