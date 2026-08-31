<script setup lang="ts">
import { Toaster } from "@steveyuowo/vue-hot-toast";
import "@steveyuowo/vue-hot-toast/vue-hot-toast.css";
import colors from "tailwindcss/colors";

const appConfig = useAppConfig();
const colorMode = useColorMode();

const color = computed(() =>
  colorMode.value === "dark"
    ? (colors as any)[appConfig.ui.colors.neutral]?.[950] ?? "#0a0a0a"
    : "white"
);
const radius = computed(
  () => `:root { --ui-radius: ${appConfig.theme.radius}rem; }`
);
const blackAsPrimary = computed(() =>
  appConfig.theme.blackAsPrimary
    ? `:root { --ui-primary: black; } .dark { --ui-primary: white; }`
    : ":root {}"
);

useHead({
  meta: [
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { key: "theme-color", name: "theme-color", content: color },
  ],
  style: [
    { innerHTML: radius, id: "nuxt-ui-radius", tagPriority: -2 },
    {
      innerHTML: blackAsPrimary,
      id: "nuxt-ui-black-as-primary",
      tagPriority: -2,
    },
  ],
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


