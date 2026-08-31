<template>
  <div class="flex flex-center h-12 py-2 my-3 px-3 max-w-sm mx-auto">
    <div class="relative w-full flex items-center">
      <UIcon
        name="i-heroicons-magnifying-glass-16-solid"
        class="absolute left-3 size-4 text-neutral-400 dark:text-neutral-500 pointer-events-none"
      />
      <input
        class="w-full pl-9 pr-8 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
        type="text"
        :value="modalValue"
        ref="input"
        placeholder="Search authenticators..."
        @input="onInput"
      />
      <UButton
        v-if="modalValue"
        icon="i-heroicons-x-mark-16-solid"
        class="absolute right-2"
        size="xs"
        variant="ghost"
        color="neutral"
        aria-label="Clear search"
        @click="resetOrClose"
      />
      <UButton
        v-else
        icon="i-lucide-x"
        class="absolute right-2"
        size="xs"
        variant="ghost"
        color="neutral"
        aria-label="Close search"
        @click="resetOrClose"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modalValue: string }>();
const emit = defineEmits<{ (e: "update:modalValue", value: string): void }>();

const input = ref<HTMLInputElement | null>(null);

const showSearchBar = useState("searchBar");

const onInput = (event: Event) => {
  emit("update:modalValue", (event.target as HTMLInputElement).value);
};

const resetOrClose = () => {
  if (props.modalValue) emit("update:modalValue", "");
  else showSearchBar.value = false;
};

onMounted(() => {
  input.value?.focus();
});
</script>

