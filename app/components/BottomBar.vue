<script setup lang="ts">
import Add from "./Add.vue";
import Menu from "./Menu.vue";

const overlay = useOverlay();
const addModal = overlay.create(Add);
const menuModal = overlay.create(Menu);

const showSearchBar = useState("searchBar", () => false);
</script>

<template>
  <!-- Only rendered on mobile screens (< md) -->
  <div class="md:hidden fixed bottom-0 inset-x-0 z-30 pointer-events-none">
    <div class="pointer-events-auto mx-auto max-w-sm px-4 pb-3">
      <div class="flex items-center justify-between h-14 px-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg border border-neutral-200/80 dark:border-neutral-800/80 rounded-2xl shadow-xl shadow-neutral-950/10">
        <UButton
          icon="i-lucide-menu"
          size="md"
          color="neutral"
          variant="ghost"
          aria-label="Open menu"
          class="cursor-pointer"
          @click="menuModal.open()"
        />

        <!-- Floating Central Add Button -->
        <button
          type="button"
          class="size-11 -mt-5 rounded-full bg-primary-600 hover:bg-primary-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-primary-600/30 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
          aria-label="Add account"
          @click="addModal.open()"
        >
          <UIcon name="i-heroicons-plus-16-solid" class="size-6 stroke-[2]" />
        </button>

        <UButton
          icon="i-heroicons-magnifying-glass-16-solid"
          size="md"
          color="neutral"
          variant="ghost"
          aria-label="Search"
          class="cursor-pointer"
          @click="showSearchBar = !showSearchBar"
        />
      </div>
    </div>
  </div>
</template>
