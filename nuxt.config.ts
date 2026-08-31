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
    serverBundle: "remote",
    localApiEndpoint: "/_nuxt_icon/:collection",
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
      globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      // Secondary cache layer for the vault sync endpoints. The primary offline path
      // is IndexedDB (app/utils/cache.ts); this gives a network-cache fallback so the
      // meta/accounts responses are servable from the SW cache when offline.
      runtimeCaching: [
        {
          urlPattern: ({ url }) => url.pathname === "/api/accounts/meta",
          handler: "NetworkFirst",
          options: {
            cacheName: "accounts-meta",
            networkTimeoutSeconds: 4,
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: ({ url }) => url.pathname === "/api/accounts",
          handler: "NetworkFirst",
          options: {
            cacheName: "accounts",
            networkTimeoutSeconds: 4,
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
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
  compatibilityDate: "2025-07-15",
});
