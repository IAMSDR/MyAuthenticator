// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  devtools: { enabled: false },

  colorMode: {
    preference: "dark",
  },

  modules: ["@nuxt/ui", "nuxt-auth-utils", "@nuxthub/core"],

  icon: {
    serverBundle: "auto",
  },
  runtimeConfig: {
    AUTH_USERNAME: "",
    AUTH_PASSWORD: "",
    DB_ENCRYPTION_PASSWORD: "",
    TELEGRAM_BOT_TOKEN: "",
    TELEGRAM_USERID: "",
  },

  hub: {
    database: true,
  },

  app: {
    head: {
      title: "MyAuthenticator",
      script: [
        { src: "https://telegram.org/js/telegram-web-app.js", defer: true },
      ],
    },
  },

  compatibilityDate: "2024-08-31",
});
