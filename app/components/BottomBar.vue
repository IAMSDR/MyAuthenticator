<script setup lang="ts">
import Add from "./Add.vue";
import Menu from "./Menu.vue";

const overlay = useOverlay();
const addModal = overlay.create(Add);
const menuModal = overlay.create(Menu);

const showSearchBar = useState("searchBar", () => false);
const searchQuery = useState("searchQuery", () => "");

const toggleSearch = () => {
  if (showSearchBar.value) {
    showSearchBar.value = false;
    searchQuery.value = "";
  } else {
    showSearchBar.value = true;
  }
};
</script>

<template>
  <div
    class="md:hidden fixed inset-x-0 z-30 px-4"
    :style="{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }"
  >
    <div class="relative h-[64px]">
      <div
        class="absolute inset-0 overflow-hidden rounded-[22px] border border-white/70 dark:border-white/[0.14] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]"
        aria-hidden="true"
      >
        <div
          class="absolute inset-0 backdrop-blur-2xl backdrop-saturate-150 bg-white/60 dark:bg-neutral-950/60"
        />
        <div
          class="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-(--ui-primary)/50 to-transparent dark:via-(--ui-primary)/40"
        />
        <div
          class="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-black/[0.05] to-transparent dark:from-black/30"
        />
      </div>

      <div class="relative flex items-center justify-between h-full px-3">
        <button
          type="button"
          aria-label="Open menu"
          class="group flex items-center justify-center size-12 rounded-2xl text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.1] active:scale-90 transition-all duration-150 focus-visible:outline-none"
          @click="menuModal.open()"
        >
          <UIcon name="i-lucide-menu" class="size-[22px]" />
        </button>

        <button
          type="button"
          aria-label="Add account"
          class="group relative flex items-center justify-center size-[54px] -mt-7 rounded-full bg-(--ui-primary) text-white active:scale-95 transition-all duration-150 focus-visible:outline-none ring-4 ring-white/70 dark:ring-neutral-950/70 shadow-lg shadow-(--ui-primary)/30 dark:shadow-(--ui-primary)/25 cursor-pointer"
          @click="addModal.open()"
        >
          <UIcon
            name="i-lucide-plus"
            class="size-[26px] stroke-[2.6] transition-transform duration-200 group-active:rotate-90 drop-shadow-sm"
          />
        </button>

        <button
          type="button"
          :aria-label="showSearchBar ? 'Close search' : 'Search'"
          :class="[
            'group flex items-center justify-center size-12 rounded-2xl active:scale-90 transition-all duration-150 focus-visible:outline-none cursor-pointer',
            showSearchBar
              ? 'bg-(--ui-primary)/15 text-(--ui-primary)'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.1]',
          ]"
          @click="toggleSearch"
        >
          <UIcon
            :name="showSearchBar ? 'i-lucide-x' : 'i-lucide-search'"
            class="size-[22px]"
          />
        </button>
      </div>
    </div>
  </div>
</template>
