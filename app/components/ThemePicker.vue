<script setup lang="ts">
import AdaptiveModal from "./AdaptiveModal.vue";

const {
  neutralColors,
  neutral,
  primaryColors,
  primary,
  blackAsPrimary,
  setBlackAsPrimary,
  radiuses,
  radius,
  fonts,
  font,
  icon,
  icons,
  modes,
  mode,
  hasChanges,
  resetTheme,
} = useTheme();
</script>

<template>
  <AdaptiveModal
    title="Theme & Style"
    description="Customize colors, radius and appearance"
  >
    <template #body>
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
              :selected="mode === m.label"
              @click="mode = m.label"
            />
          </div>
        </fieldset>

        <!-- Reset -->
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
