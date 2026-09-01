<script setup lang="ts">
import colors from "tailwindcss/colors";

const props = defineProps<{
  label: string;
  icon?: string;
  chip?: string;
  selected?: boolean;
}>();
</script>

<template>
  <UButton
    size="sm"
    color="neutral"
    variant="outline"
    :icon="icon"
    :label="label"
    class="capitalize ring-(--ui-border) rounded-[calc(var(--ui-radius))] text-[11px] cursor-pointer"
    :class="[selected ? 'bg-(--ui-bg-elevated)' : 'hover:bg-(--ui-bg-elevated)/50']"
  >
    <template v-if="chip" #leading>
      <slot name="leading">
        <span
          class="inline-block size-2 rounded-full"
          :class="`bg-(--color-light) dark:bg-(--color-dark)`"
          :style="{
            '--color-light': (colors as any)[chip === 'old-neutral' ? 'neutral' : chip]?.[500] ?? `var(--color-${chip}-500)`,
            '--color-dark': (colors as any)[chip === 'old-neutral' ? 'neutral' : chip]?.[400] ?? `var(--color-${chip}-400)`,
          } as any"
        />
      </slot>
    </template>
  </UButton>
</template>

