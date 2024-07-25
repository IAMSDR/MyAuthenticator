<template>
  <img
    v-if="isImg && !error"
    :src="imgPath"
    alt="logo"
    :class="imgclass"
    @error="error = true"
  />
  <span v-else-if="error"></span>
  <UIcon
    v-else
    :name="icon && `i-simple-icons-${icon}`"
    :class="class"
    class="text-gray-800 dark:text-gray-200"
    dynamic
  />
</template>

<script setup lang="ts">
import iconsLight from "~/assets/json/icons-light.json";
const props = defineProps<{
  isImg: boolean;
  icon: string;
  class?: string;
  imgclass?: string;
}>();

const colorMode = useColorMode();

const error = ref(false);

const imgPath = computed(() => {
  if (colorMode.value === "dark") return `/icons/${props.icon}.svg`;
  return iconsLight.includes(props.icon)
    ? `/icons/${props.icon}-light.svg`
    : `/icons/${props.icon}.svg`;
});

watch(
  () => props.icon,
  () => {
    if (error.value) {
      error.value = false;
    }
  }
);
</script>
