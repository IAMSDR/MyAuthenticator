<template>
  <UContainer>
    <NuxtPage />
    <UModals />
    <Toaster />
  </UContainer>
  <ClientOnly v-if="route.query.tma">
    <TelegramMiniApp />
  </ClientOnly>
</template>

<script setup lang="ts">
import { Toaster } from "@steveyuowo/vue-hot-toast";
import "@steveyuowo/vue-hot-toast/vue-hot-toast.css";
import TelegramMiniApp from "./components/TelegramMiniApp.vue";

const route = useRoute();
</script>

<style>
::-webkit-scrollbar {
  scrollbar-width: none;
  display: none;
}

body {
  @apply font-sans text-gray-950 bg-gray-50 dark:bg-gray-950 dark:text-gray-100 scroll-smooth;
}

.flex-center {
  @apply flex justify-center items-center;
}

.VueHotToast__toast {
  @apply !p-1.5;
}
</style>
