<script setup lang="ts">
import { Toaster } from "@steveyuowo/vue-hot-toast";
import "@steveyuowo/vue-hot-toast/vue-hot-toast.css";

const { style, link, color } = useTheme();

useHead({
  meta: [
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { key: "theme-color", name: "theme-color", content: color },
  ],
  link,
  style,
  title: "MyAuthenticator",
  htmlAttrs: {
    lang: "en",
  },
});
</script>

<template>
  <NuxtPwaManifest />
  <UApp :toaster="{ expand: false, position: 'top-right' }">
    <NuxtPage />
    <Toaster />
  </UApp>
</template>
