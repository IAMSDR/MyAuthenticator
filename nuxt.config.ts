// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: [
    "@nuxt/ui",
    "@nuxt/eslint",
    "@vueuse/nuxt",
    "nuxt-auth-utils",
    "@vite-pwa/nuxt",
  ],
  css: ["~/assets/css/main.css"],
  icon: {
    serverBundle: "local",
    clientBundle: {
      scan: true,
      sizeLimitKb: 512,
    },
    fallbackToApi: true,
    iconifyApiEndpoint: "https://api.iconify.design",
  },
  runtimeConfig: {
    session: {
      password: "",
    },
    upstashRedisRestUrl: "",
    upstashRedisRestToken: "",
    redisUrl: "",
  },
  devServer: {
    host: "0.0.0.0",
  },
  vite: {
    server: {
      host: "0.0.0.0",
      allowedHosts: true,
    },
  },
  future: {
    compatibilityVersion: 4,
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
      globPatterns: ["**/*.{js,css,png,svg,ico,woff2}"],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      navigateFallback: null,
    },
    injectManifest: {
      globPatterns: ["**/*.{js,css,png,svg,ico,woff2}"],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
      suppressWarnings: true,
      type: "module",
    },
  },
  compatibilityDate: "2025-07-15",
});
