<script setup lang="ts">
import Add from "./Add.vue";
import Menu from "./Menu.vue";

const overlay = useOverlay();

const addModal = overlay.create(Add);
const menuModal = overlay.create(Menu);

const showSearchBar = useState("searchBar");
</script>

<template>
  <div
    class="fixed bottom-0 z-10 flex items-center px-4 inset-x-0 h-14 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 w-full max-w-sm xl:max-w-md mx-auto rounded-t-xl shadow-lg"
  >
    <UButton
      icon="i-lucide-menu"
      size="md"
      color="neutral"
      variant="ghost"
      aria-label="Menu"
      class="cursor-pointer"
      @click="menuModal.open()"
    />
    <UButton
      class="relative mx-auto bottom-6 rounded-full size-12 active:translate-y-0.5 flex-center shadow-lg cursor-pointer bg-primary-600 hover:bg-primary-500 text-white"
      color="primary"
      variant="solid"
      aria-label="Add account"
      @click="addModal.open()"
    >
      <UIcon name="i-heroicons-plus-16-solid" class="size-6 text-white" />
    </UButton>
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
</template>


