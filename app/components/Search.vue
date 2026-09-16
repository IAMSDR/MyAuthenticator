<template>
  <div class="flex justify-center px-4 pt-1 pb-3">
    <div class="relative w-full max-w-sm flex items-center group">
      <UIcon
        name="i-lucide-search"
        class="absolute left-3.5 size-[15px] text-neutral-400 dark:text-neutral-500 group-focus-within:text-neutral-900 dark:group-focus-within:text-white transition-colors pointer-events-none"
      />
      <input
        class="w-full h-9 pl-9 pr-9 rounded-full bg-neutral-100/80 dark:bg-white/[0.06] border border-transparent hover:bg-neutral-100 dark:hover:bg-white/[0.08] focus:bg-white dark:focus:bg-neutral-900 focus:border-neutral-200 dark:focus:border-white/10 text-[13px] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-0 transition-all"
        type="text"
        :value="modalValue"
        ref="input"
        placeholder="Search"
        @input="onInput"
      >
      <button
        v-if="modalValue"
        type="button"
        class="absolute right-1.5 size-6 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center hover:bg-black dark:hover:bg-neutral-100 transition-colors"
        aria-label="Clear search"
        @click="resetOrClose"
      >
        <UIcon name="i-lucide-x" class="size-3.5" />
      </button>
      <button
        v-else
        type="button"
        class="absolute right-1.5 size-6 rounded-full text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
        aria-label="Close search"
        @click="resetOrClose"
      >
        <UIcon name="i-lucide-x" class="size-3.5" />
      </button>
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

