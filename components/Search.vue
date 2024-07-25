<template>
  <div class="flex flex-center h-10 py-4 my-3 px-2">
    <UIcon
      name="i-heroicons-magnifying-glass-16-solid"
      class="relative h-5 w-5 left-5"
    />
    <input
      class="bg-transparent pl-8 p-1.5 outline-none border-b border-primary w-full max-w-sm"
      type="text"
      @input="onInput"
      :value="modalValue"
      ref="input"
      placeholder="Search"
    />
    <UButton
      icon="i-heroicons-x-mark-16-solid"
      class="relative right-6"
      size="xs"
      variant="ghost"
      color="gray"
      @click="resetOrClose"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps(["modalValue"]);
const emit = defineEmits(["update:modalValue"]);

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
