<template>
  <Transition name="slide">
    <Search v-if="showSearchBar" v-model:modal-value="searchQuery" />
  </Transition>
  <div
    v-show="!data?.length"
    class="h-dvh overflow-hidden flex-center flex-col space-y-2"
  >
    <UIcon name="i-heroicons-inbox-stack" class="h-8 w-8" />
    <span class="text-lg sm:text-xl font-semibold">Nothing here yet.</span>
    <span class="text-sm font-normal text-gray-400"
      >Please use the button below to add something !</span
    >
  </div>
  <div
    v-show="accounts?.length"
    class="h-full scroll-smooth w-full grid place-items-center gap-y-10 gap-x-4 mt-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 pb-20 sm:pb-10"
  >
    <Tile v-for="account in accounts" :account="account" :key="account.id" />
  </div>
  <Footer />
</template>

<script setup lang="ts">
import Footer from "~/components/Footer.vue";
import Search from "~/components/Search.vue";

definePageMeta({
  middleware: "auth",
});

const { data } = await useFetch("/api/accounts", { key: "accounts" });

const searchQuery = ref("");

const accounts = computed(() =>
  showSearchBar.value ? searchResults.value : data.value
);

const searchResults = computed(() => {
  const regex = new RegExp(searchQuery.value, "i");
  return data.value?.filter(
    (item) => regex.test(item.label) || regex.test(item.issuer)
  );
});

// useState
const showSearchBar = useState("searchBar", () => false);
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  @apply transition-all duration-500 ease-in-out;
}

.slide-enter-from,
.slide-leave-to {
  @apply opacity-0 -translate-y-10 scale-75;
}
</style>
