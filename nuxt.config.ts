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
      allowedHosts: ["temp.iamsdr.in"],
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
  nitro: {
    // Default to node-server locally. For Cloudflare Workers/Pages deployment
    // set NITRO_PRESET=cloudflare_module (or cloudflare_pages). `ioredis` is
    // Node-TCP only and pulls `node:string_decoder` / `node:net` which unenv
    // cannot polyfill ("StringDecoder is not implemented yet"). We alias it to
    // a local empty mock for cloudflare builds and lazy-load it in
    // server/utils/redis.ts.
    preset: process.env.NITRO_PRESET || undefined,
    alias:
      process.env.NITRO_PRESET?.includes("cloudflare")
        ? {
            ioredis: "./server/mocks/ioredis-empty.ts",
          }
        : {},
  },
});
