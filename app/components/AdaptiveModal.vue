<script setup lang="ts">
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";

withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    close?: boolean | object;
    dismissible?: boolean;
    ui?: Record<string, unknown>;
  }>(),
  {
    title: undefined,
    description: undefined,
    close: true,
    dismissible: true,
    ui: undefined,
  }
);

const emit = defineEmits<{
  (e: "close"): void;
  (e: "update:open", value: boolean): void;
}>();

const openModel = defineModel<boolean>("open", { default: true });

const breakpoints = useBreakpoints(breakpointsTailwind);
const isDesktop = breakpoints.greaterOrEqual("md");

const handleOpenChange = (val: boolean) => {
  openModel.value = val;
  emit("update:open", val);
  if (!val) {
    emit("close");
  }
};
</script>

<template>
  <!-- Desktop: Centered Floating Modal -->
  <UModal
    v-if="isDesktop"
    :open="openModel"
    :title="title"
    :description="description"
    :close="close"
    :dismissible="dismissible"
    :ui="ui"
    @update:open="handleOpenChange"
  >
    <template v-if="$slots.header" #header="slotProps">
      <slot name="header" v-bind="slotProps" />
    </template>
    <template v-if="$slots.title" #title="slotProps">
      <slot name="title" v-bind="slotProps" />
    </template>
    <template v-if="$slots.description" #description="slotProps">
      <slot name="description" v-bind="slotProps" />
    </template>
    <template v-if="$slots.actions" #actions="slotProps">
      <slot name="actions" v-bind="slotProps" />
    </template>
    <template v-if="$slots.body" #body="slotProps">
      <slot name="body" v-bind="slotProps" />
    </template>
    <template v-if="$slots.footer" #footer="slotProps">
      <slot name="footer" v-bind="slotProps" />
    </template>
    <template v-if="$slots.close" #close="slotProps">
      <slot name="close" v-bind="slotProps" />
    </template>
    <template v-if="$slots.default" #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
  </UModal>

  <!-- Mobile: Smooth Bottom Sheet Drawer -->
  <UDrawer
    v-else
    direction="bottom"
    :handle="true"
    :open="openModel"
    :title="title"
    :description="description"
    :close="close"
    :dismissible="dismissible"
    :ui="ui"
    @update:open="handleOpenChange"
  >
    <template v-if="$slots.header" #header="slotProps">
      <slot name="header" v-bind="slotProps" />
    </template>
    <template v-if="$slots.title" #title="slotProps">
      <slot name="title" v-bind="slotProps" />
    </template>
    <template v-if="$slots.description" #description="slotProps">
      <slot name="description" v-bind="slotProps" />
    </template>
    <template v-if="$slots.actions" #actions="slotProps">
      <slot name="actions" v-bind="slotProps" />
    </template>
    <template v-if="$slots.body" #body="slotProps">
      <slot name="body" v-bind="slotProps" />
    </template>
    <template v-if="$slots.footer" #footer="slotProps">
      <slot name="footer" v-bind="slotProps" />
    </template>
    <template v-if="$slots.close" #close="slotProps">
      <slot name="close" v-bind="slotProps" />
    </template>
    <template v-if="$slots.default" #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
  </UDrawer>
</template>
