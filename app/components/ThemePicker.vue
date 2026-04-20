<script setup lang="ts">
import colors from "tailwindcss/colors";
import { omit } from "#ui/utils";

const appConfig = useAppConfig();
const colorMode = useColorMode();

const neutralColors = ["slate", "gray", "zinc", "neutral", "stone"];
const neutral = computed({
  get() {
    return appConfig.ui.colors.neutral;
  },
  set(option) {
    appConfig.ui.colors.neutral = option;
    window.localStorage.setItem("nuxt-ui-neutral", appConfig.ui.colors.neutral);
  },
});

const colorsToOmit = [
  "inherit",
  "current",
  "transparent",
  "black",
  "white",
  ...neutralColors,
];
const primaryColors = Object.keys(omit(colors, colorsToOmit as Record<string, unknown>));
const primary = computed({
  get() {
    return appConfig.ui.colors.primary;
  },
  set(option) {
    appConfig.ui.colors.primary = option;
    window.localStorage.setItem("nuxt-ui-primary", appConfig.ui.colors.primary);
    setBlackAsPrimary(false);
  },
});

const radiuses = [0, 0.125, 0.25, 0.375, 0.5];
const radius = computed({
  get() {
    return appConfig.theme.radius;
  },
  set(option) {
    appConfig.theme.radius = option;
    window.localStorage.setItem(
      "nuxt-ui-radius",
      String(appConfig.theme.radius)
    );
  },
});

const modes = [
  {
    label: "light",
    icon: "i-line-md-moon-filled-to-sunny-filled-loop-transition",
  },
  {
    label: "dark",
    icon: "i-line-md-sunny-filled-loop-to-moon-filled-loop-transition",
  },
  { label: "system", icon: "i-hugeicons-computer" },
];
const mode = computed({
  get() {
    return colorMode.value;
  },
  set(option) {
    colorMode.preference = option;
  },
});

function setBlackAsPrimary(value: boolean) {
  appConfig.theme.blackAsPrimary = value;
  window.localStorage.setItem("nuxt-ui-black-as-primary", String(value));
}
</script>

<template>
  <UModal
    title="Theme"
    :ui="{ close: 'top-2 start-6 end-auto' }"
    close-icon="i-lucide-arrow-left"
  >
    <template #body>
      <div class="p-1 flex-col flex space-y-3 py-2">
        <fieldset>
          <legend class="text-[11px] leading-none font-semibold mb-2">
            Primary
          </legend>

          <div class="grid grid-cols-3 gap-1 -mx-2">
            <ThemePickerButton
              chip="primary"
              label="Black"
              :selected="appConfig.theme.blackAsPrimary"
              @click="setBlackAsPrimary(true)"
            >
              <template #leading>
                <span
                  class="inline-block w-2 h-2 rounded-full bg-black dark:bg-white"
                />
              </template>
            </ThemePickerButton>
            <ThemePickerButton
              v-for="color in primaryColors"
              :key="color"
              :label="color"
              :chip="color"
              :selected="!appConfig.theme.blackAsPrimary && primary === color"
              @click="primary = color"
            />
          </div>
        </fieldset>
        <fieldset>
          <legend class="text-[11px] leading-none font-semibold mb-2">
            Neutral
          </legend>

          <div class="grid grid-cols-3 gap-1 -mx-2">
            <ThemePickerButton
              v-for="color in neutralColors"
              :key="color"
              :label="color"
              :chip="color"
              :selected="neutral === color"
              @click="neutral = color"
            />
          </div>
        </fieldset>
        <fieldset>
          <legend class="text-[11px] leading-none font-semibold mb-2">
            Radius
          </legend>

          <div class="grid grid-cols-5 gap-1 -mx-2">
            <ThemePickerButton
              v-for="r in radiuses"
              :key="r"
              :label="String(r)"
              class="justify-center px-0"
              :selected="radius === r"
              @click="radius = r"
            />
          </div>
        </fieldset>
        <fieldset>
          <legend class="text-[11px] leading-none font-semibold mb-2">
            Theme
          </legend>

          <div class="grid grid-cols-3 gap-1 -mx-2">
            <ThemePickerButton
              v-for="m in modes"
              :key="m.label"
              v-bind="m"
              :selected="colorMode.preference === m.label"
              @click="mode = m.label"
            />
          </div>
        </fieldset>
      </div>
    </template>
  </UModal>
</template>
