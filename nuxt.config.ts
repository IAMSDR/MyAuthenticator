// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: [
    "@nuxt/ui",
    "@nuxt/eslint",
    "@vueuse/nuxt",
    "@nuxthub/core",
    "nuxt-auth-utils",
    "@vite-pwa/nuxt",
  ],
  css: ["~/assets/css/main.css"],
  icon: {
    serverBundle: "remote",
    localApiEndpoint: "/_nuxt_icon/:collection",
  },
  runtimeConfig: {
    AUTH_USERNAME: "",
    AUTH_PASSWORD: "",
    DB_ENCRYPTION_PASSWORD: "",
  },
  hub: {
    db: { dialect: "sqlite" },
    kv: true,
  },
  auth: {
    webAuthn: true,
  },
  pwa: {
    includeAssets: ["favicon.ico", "favicon-16x16.png"],
    manifest: {
      name: "MyAuthenticator",
      short_name: "MyAuthenticator",
      theme_color: "#0f172b",
      orientation: "natural",
      display: "standalone",
      background_color: "#0f172b",
      start_url: "/",
      lang: "en",
      icons: [
        {
          src: "pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
      ],
    },
    workbox: {
      globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    },
    injectManifest: {
      globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallback: "/",
      navigateFallbackAllowlist: [/^\/$/],
      type: "module",
    },
  },
  compatibilityDate: "2025-03-15",
});
