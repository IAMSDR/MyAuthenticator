<script setup lang="ts">
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
  <UApp :toaster="null">
    <NuxtPage />
  </UApp>

  <Teleport to="body">
    <Toaster position="top-center" />
  </Teleport>
</template>
