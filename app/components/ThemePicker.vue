<script setup lang="ts">
import AdaptiveModal from "./AdaptiveModal.vue";
import colors from "tailwindcss/colors";
import { omit } from "#ui/utils";

const appConfig = useAppConfig();
const colorMode = useColorMode();

// --- Neutral / Primary (adopted from nuxt/ui docs useTheme) ---
// docs: neutralColors = ['slate','gray','zinc','neutral','stone','taupe','mauve','mist','olive'] docs/app/composables/useTheme.ts:60
const neutralColors = ["slate", "gray", "zinc", "neutral", "stone", "taupe", "mauve", "mist", "olive"] as const;

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
] as const;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const primaryColors = Object.keys(omit(colors, colorsToOmit as any));

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

function setBlackAsPrimary(value: boolean) {
  appConfig.theme.blackAsPrimary = value;
  window.localStorage.setItem("nuxt-ui-black-as-primary", String(value));
}

// keep computed for blackAsPrimary to match docs `blackAsPrimary.value`
const blackAsPrimary = computed(() => appConfig.theme.blackAsPrimary);

// --- Radius (same as docs) ---
const radiuses = [0, 0.125, 0.25, 0.375, 0.5];
const radius = computed({
  get() {
    return appConfig.theme.radius;
  },
  set(option) {
    appConfig.theme.radius = option;
    window.localStorage.setItem("nuxt-ui-radius", String(appConfig.theme.radius));
  },
});

// --- Font (Nuxt UI 4 docs: ['Public Sans','DM Sans','Geist','Inter','Poppins','Outfit','Raleway']) ---
const fonts = ["Public Sans", "DM Sans", "Geist", "Inter", "Poppins", "Outfit", "Raleway"];
const _font = ref<string>("Public Sans");
if (import.meta.client) {
  const saved = window.localStorage.getItem("nuxt-ui-font");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      _font.value = typeof parsed === "string" ? parsed : saved;
    } catch {
      _font.value = saved;
    }
  }
  // also inject style like docs useTheme fontStyle
  watchEffect(() => {
    let el = document.getElementById("nuxt-ui-font") as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = "nuxt-ui-font";
      document.head.appendChild(el);
    }
    el.innerHTML = `:root { --font-sans: '${_font.value}', sans-serif; }`;
    // keep app.vue style in sync if needed
  });
}
const font = computed({
  get() { return _font.value; },
  set(option: string) {
    _font.value = option;
    if (import.meta.client) window.localStorage.setItem("nuxt-ui-font", option);
  },
});

// --- Icons (Nuxt UI 4 docs utils/theme.ts) ---
const icons = [
  { label: "Lucide", icon: "i-lucide-feather", value: "lucide" },
  { label: "Phosphor", icon: "i-ph-phosphor-logo", value: "phosphor" },
  { label: "Tabler", icon: "i-tabler-brand-tabler", value: "tabler" },
] as const;
// minimal mapping to appConfig.ui.icons if needed (docs themeIcons)
const themeIcons: Record<string, Record<string, string>> = {
  lucide: {
    light: "i-lucide-sun",
    dark: "i-lucide-moon",
    system: "i-lucide-monitor",
  },
  phosphor: {
    light: "i-ph-sun",
    dark: "i-ph-moon",
    system: "i-ph-monitor",
  },
  tabler: {
    light: "i-tabler-sun",
    dark: "i-tabler-moon",
    system: "i-tabler-device-desktop",
  },
};
const _iconSet = ref<string>("lucide");
if (import.meta.client) {
  const saved = window.localStorage.getItem("nuxt-ui-icons");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      _iconSet.value = typeof parsed === "string" ? parsed : saved;
    } catch {
      _iconSet.value = saved;
    }
  }
  // keep appConfig.ui.icons in sync like docs
  watch(
    _iconSet,
    (val) => {
      const mapping = themeIcons[val as keyof typeof themeIcons];
      if (mapping && appConfig.ui.icons) {
        // @ts-expect-error -- runtime icon mapping assignment, safe
        appConfig.ui.icons = { ...appConfig.ui.icons, ...mapping };
      }
    },
    { immediate: true }
  );
}
const icon = computed({
  get() { return _iconSet.value; },
  set(option: string) {
    _iconSet.value = option;
    if (import.meta.client) window.localStorage.setItem("nuxt-ui-icons", option);
    const mapping = themeIcons[option as keyof typeof themeIcons];
    if (mapping && appConfig.ui.icons) {
      // @ts-expect-error -- runtime icon mapping assignment, safe
      appConfig.ui.icons = { ...appConfig.ui.icons, ...mapping };
    }
  },
});

// --- Color Mode (docs uses appConfig.ui.icons.light/dark/system) ---
const modes = computed(() => [
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { label: "light", icon: (appConfig.ui.icons as any)?.light ?? "i-lucide-sun" },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { label: "dark", icon: (appConfig.ui.icons as any)?.dark ?? "i-lucide-moon" },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { label: "system", icon: (appConfig.ui.icons as any)?.system ?? "i-lucide-monitor" },
]);
const mode = computed({
  get() {
    return colorMode.preference;
  },
  set(option) {
    // @ts-expect-error -- colorMode preference string assignment, safe
    colorMode.preference = option;
  },
});

function resetTheme() {
  primary.value = "green";
  window.localStorage.removeItem("nuxt-ui-primary");
  // app/app.config.ts default is "neutral" - match app config, not docs "slate", to keep existing default
  neutral.value = "neutral";
  window.localStorage.removeItem("nuxt-ui-neutral");
  radius.value = 0.375;
  window.localStorage.removeItem("nuxt-ui-radius");
  font.value = "Public Sans";
  window.localStorage.removeItem("nuxt-ui-font");
  icon.value = "lucide";
  window.localStorage.removeItem("nuxt-ui-icons");
  setBlackAsPrimary(false);
  window.localStorage.removeItem("nuxt-ui-black-as-primary");
  window.localStorage.removeItem("nuxt-ui-custom-colors");
  window.localStorage.removeItem("nuxt-ui-css-variables");
  window.localStorage.removeItem("nuxt-ui-ai-theme");
}

const hasChanges = computed(() => {
  return (
    primary.value !== "green" ||
    neutral.value !== "neutral" ||
    radius.value !== 0.375 ||
    font.value !== "Public Sans" ||
    icon.value !== "lucide" ||
    blackAsPrimary.value
  );
});
</script>

<template>
  <AdaptiveModal
    title="Theme & Style"
    description="Customize colors, radius and appearance"
  >
    <template #body>
      <!-- Mirrors nuxt/ui docs/app/components/theme-picker/ThemePicker.vue inside UPopover content -->
      <div class="flex flex-col gap-4">
        <!-- Primary -->
        <fieldset>
          <legend class="text-[11px] leading-none font-semibold mb-2 select-none flex items-center gap-1">
            Primary
            <UButton
              to="https://ui.nuxt.com/docs/getting-started/theme/css-variables#colors"
              target="_blank"
              size="xs"
              color="neutral"
              variant="link"
              icon="i-lucide-help-circle"
              class="p-0 -my-0.5"
              :ui="{ leadingIcon: 'size-3' }"
              aria-label="Primary help"
            />
          </legend>
          <div class="grid grid-cols-3 gap-1 -mx-2">
            <ThemePickerButton
              label="Black"
              :selected="blackAsPrimary"
              @click="setBlackAsPrimary(true)"
            >
              <template #leading>
                <span class="inline-block size-2 rounded-full bg-black dark:bg-white" />
              </template>
            </ThemePickerButton>
            <ThemePickerButton
              v-for="color in primaryColors"
              :key="color"
              :label="color"
              :chip="color"
              :selected="!blackAsPrimary && primary === color"
              @click="primary = color"
            />
          </div>
        </fieldset>

        <!-- Neutral -->
        <fieldset>
          <legend class="text-[11px] leading-none font-semibold mb-2 select-none flex items-center gap-1">
            Neutral
            <UButton
              to="https://ui.nuxt.com/docs/getting-started/theme/css-variables#text"
              target="_blank"
              size="xs"
              color="neutral"
              variant="link"
              icon="i-lucide-help-circle"
              class="p-0 -my-0.5"
              :ui="{ leadingIcon: 'size-3' }"
              aria-label="Neutral help"
            />
          </legend>
          <div class="grid grid-cols-3 gap-1 -mx-2">
            <ThemePickerButton
              v-for="color in neutralColors"
              :key="color"
              :label="color"
              :chip="color === 'neutral' ? 'old-neutral' : color"
              :selected="neutral === color"
              @click="neutral = color"
            />
          </div>
        </fieldset>

        <!-- Radius -->
        <fieldset>
          <legend class="text-[11px] leading-none font-semibold mb-2 select-none flex items-center gap-1">
            Radius
            <UButton
              to="https://ui.nuxt.com/docs/getting-started/theme/css-variables#radius"
              target="_blank"
              size="xs"
              color="neutral"
              variant="link"
              icon="i-lucide-help-circle"
              class="p-0 -my-0.5"
              :ui="{ leadingIcon: 'size-3' }"
              aria-label="Radius help"
            />
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

        <!-- Font -->
        <fieldset>
          <legend class="text-[11px] leading-none font-semibold mb-2 select-none flex items-center gap-1">
            Font
            <UButton
              to="https://ui.nuxt.com/docs/getting-started/integrations/fonts"
              target="_blank"
              size="xs"
              color="neutral"
              variant="link"
              icon="i-lucide-help-circle"
              class="p-0 -my-0.5"
              :ui="{ leadingIcon: 'size-3' }"
              aria-label="Font help"
            />
          </legend>
          <div class="-mx-2">
            <USelect
              v-model="font"
              size="sm"
              color="neutral"
              icon="i-lucide-type"
              :items="fonts"
              class="w-full ring-default rounded-sm hover:bg-elevated/50 text-[11px] data-[state=open]:bg-elevated/50"
              :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
            />
          </div>
        </fieldset>

        <!-- Icons -->
        <fieldset>
          <legend class="text-[11px] leading-none font-semibold mb-2 select-none flex items-center gap-1">
            Icons
            <UButton
              to="https://ui.nuxt.com/docs/getting-started/integrations/icons"
              target="_blank"
              size="xs"
              color="neutral"
              variant="link"
              icon="i-lucide-help-circle"
              class="p-0 -my-0.5"
              :ui="{ leadingIcon: 'size-3' }"
              aria-label="Icons help"
            />
          </legend>
          <div class="-mx-2">
            <USelect
              v-model="icon"
              size="sm"
              color="neutral"
              :icon="icons.find(i => i.value === icon)?.icon"
              :items="icons"
              class="w-full ring-default rounded-sm hover:bg-elevated/50 capitalize text-[11px] data-[state=open]:bg-elevated/50"
              :ui="{ item: 'capitalize text-[11px]', trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
            />
          </div>
        </fieldset>

        <!-- Color Mode -->
        <fieldset>
          <legend class="text-[11px] leading-none font-semibold mb-2 select-none flex items-center gap-1">
            Color Mode
            <UButton
              to="https://ui.nuxt.com/docs/getting-started/integrations/color-mode"
              target="_blank"
              size="xs"
              color="neutral"
              variant="link"
              icon="i-lucide-help-circle"
              class="p-0 -my-0.5"
              :ui="{ leadingIcon: 'size-3' }"
              aria-label="Color mode help"
            />
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

        <!-- Reset (like docs Export fieldset reset button) -->
        <fieldset v-if="hasChanges">
          <legend class="text-[11px] leading-none font-semibold mb-2 select-none">
            Reset
          </legend>
          <div class="flex items-center -mx-2">
            <UTooltip text="Reset theme to defaults">
              <UButton
                color="neutral"
                variant="outline"
                size="sm"
                icon="i-lucide-rotate-ccw"
                label="Reset to defaults"
                class="w-full ring-default hover:bg-elevated/50 text-[11px] justify-center"
                @click="resetTheme"
              />
            </UTooltip>
          </div>
        </fieldset>
      </div>
    </template>
  </AdaptiveModal>
</template>
