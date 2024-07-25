<template>
  <UModal>
    <UButton
      :icon="
        colorMode.value === 'dark'
          ? 'i-heroicons-sun-20-solid'
          : 'i-heroicons-moon-20-solid'
      "
      class="w-max self-center p-2 rounded-full"
      color="black"
      variant="solid"
      size="xs"
      @click="
        colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
      "
    />
    <div class="grid grid-cols-5 gap-2 w-max mx-auto my-4">
      <UButton
        v-for="color in primaryColors"
        color="white"
        square
        :ui="{
          color: {
            white: {
              solid:
                'ring-0 bg-gray-100 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800',
              ghost: 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
            },
          },
        }"
        :variant="color.value === appConfig.ui.primary ? 'solid' : 'ghost'"
        @click="setPrimaryColor(color.value)"
      >
        <span
          class="inline-block w-3 h-3 rounded-full"
          :style="{ backgroundColor: color.hex }"
        />
      </UButton>
    </div>
    <div class="flex-center space-x-3">
      <UButton
        icon="i-material-symbols-settings-backup-restore-rounded"
        variant="ghost"
        class=""
        color="primary"
        @click="openRestore"
      >
        Restore
      </UButton>
      <span
        class="border-primary-200 dark:border-primary-900 border-l w-0 h-5 self-center"
      ></span>
      <UButton
        icon="i-heroicons-document-arrow-up"
        variant="ghost"
        color="primary"
        class=""
        @click="openBackup"
      >
        Backup
      </UButton>
    </div>
    <hr class="my-2 border-t border-primary-200 dark:border-primary-900" />
    <UButton
      icon="i-heroicons-arrow-left-on-rectangle"
      color="primary"
      variant="ghost"
      block
      class="gap-x-3 p-2.5 px-6"
      @click="Logout"
      >Logout</UButton
    >
  </UModal>
</template>

<script setup lang="ts">
import colors from "#tailwind-config/theme/colors";
import Restore from "~/components/Restore.vue";
import Backup from "~/components/Backup.vue";

const appConfig = useAppConfig();
const colorMode = useColorMode();

const modal = useModal();

const { clear } = useUserSession();

const primaryColors = computed(() =>
  appConfig.ui.colors
    .filter((color) => color !== "primary")
    .map((color) => ({
      value: color,
      text: color,
      hex: colors[color as keyof typeof colors][
        colorMode.value === "dark" ? 400 : 500
      ],
    }))
);

const setPrimaryColor = (color: string) => {
  appConfig.ui.primary = color;
  window.localStorage.setItem("nuxt-ui-primary", appConfig.ui.primary);
};

const openRestore = async () => {
  await modal.close();
  setTimeout(() => modal.open(Restore), 400);
};

const openBackup = async () => {
  await modal.close();
  setTimeout(() => modal.open(Backup), 400);
};

const Logout = async () => {
  await clear();
  reloadNuxtApp({ path: "/", force: true });
};
</script>
