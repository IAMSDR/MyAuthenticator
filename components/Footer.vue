<template>
  <div
    class="fixed bottom-0 z-10 flex items-center px-2 inset-x-0 h-12 bg-white ring-1 ring-gray-200 dark:ring-gray-800 dark:bg-gray-800 w-full max-w-sm xl:max-w-md mx-auto rounded-t-3xl"
  >
    <UButton
      icon="i-heroicons-bars-3-16-solid"
      size="xl"
      color="gray"
      variant="ghost"
      @click="modal.open(Menu)"
    />
    <UButton
      class="relative mx-auto bottom-6 rounded-full h-12 w-12 active:translate-y-0.5 flex-center"
      color="primary"
      variant="solid"
      @click="modal.open(Add)"
    >
      <UIcon name="i-heroicons-plus-16-solid" class="h-full w-full" />
    </UButton>
    <UButton
      icon="i-heroicons-magnifying-glass-16-solid"
      size="xl"
      color="gray"
      variant="ghost"
      @click="showSearchBar = !showSearchBar"
    />
  </div>
</template>

<script setup lang="ts">
import Add from "~/components/Add.vue";
import Menu from "~/components/Menu.vue";

const modal = useModal();

const showSearchBar = useState("searchBar");
</script>
