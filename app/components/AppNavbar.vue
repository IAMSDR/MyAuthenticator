<script setup lang="ts">
import { onKeyStroke } from "@vueuse/core";
import Add from "./Add.vue";
import Menu from "./Menu.vue";

const overlay = useOverlay();
const addModal = overlay.create(Add);
const menuModal = overlay.create(Menu);

const showSearchBar = useState("searchBar", () => false);
const searchQuery = useState("searchQuery", () => "");

const searchInputRef = ref<HTMLInputElement | null>(null);

// Global shortcut: Ctrl+K or Cmd+K focuses search
onKeyStroke(["k", "K"], (e) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    showSearchBar.value = true;
    nextTick(() => {
      searchInputRef.value?.focus();
    });
  }
});

// Escape closes search input focus when empty
onKeyStroke("Escape", () => {
  if (showSearchBar.value && !searchQuery.value) {
    showSearchBar.value = false;
  }
});
</script>

<template>
  <header class="hidden md:block sticky top-0 z-30 w-full bg-white/70 dark:bg-neutral-950/60 backdrop-blur-2xl border-b border-neutral-200/50 dark:border-white/[0.07]">
    <div class="mx-auto flex h-[56px] max-w-7xl items-center gap-4 px-6 lg:px-8">
      <!-- Center: Minimal pill search — no brand, fully centered -->
      <div class="flex-1 flex justify-center">
        <div class="relative w-full max-w-[480px] group">
          <UIcon
            name="i-lucide-search"
            class="absolute left-3.5 top-1/2 -translate-y-1/2 size-[15px] text-neutral-400 dark:text-neutral-500 group-focus-within:text-neutral-900 dark:group-focus-within:text-neutral-200 transition-colors pointer-events-none"
          />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Search"
            class="w-full h-[36px] pl-9 pr-[72px] rounded-full bg-neutral-100/80 dark:bg-white/[0.06] border border-transparent hover:bg-neutral-100 dark:hover:bg-white/[0.08] focus:bg-white dark:focus:bg-neutral-900 focus:border-neutral-200 dark:focus:border-white/10 text-[13px] leading-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-0 transition-all"
          >
          <div class="absolute right-1.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 pointer-events-none">
            <span class="inline-flex items-center gap-1 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 px-2 py-1 shadow-sm">
              <kbd class="text-[10px] font-medium leading-none tracking-widest text-neutral-500 dark:text-neutral-400 font-sans">⌘</kbd>
              <kbd class="text-[10px] font-medium leading-none tracking-widest text-neutral-500 dark:text-neutral-400 font-sans">K</kbd>
            </span>
          </div>
        </div>
      </div>

      <!-- Right: Actions — Add is accent-aligned for clarity -->
      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          aria-label="Add account"
          class="inline-flex items-center gap-1.5 h-8 pl-3 pr-3.5 rounded-full bg-primary-600 hover:bg-primary-500 active:bg-primary-700 active:scale-[0.97] text-white shadow-sm shadow-primary-600/20 text-[13px] font-semibold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
          @click="addModal.open()"
        >
          <UIcon name="i-lucide-plus" class="size-3.5 stroke-[2.6]" />
          <span>Add</span>
        </button>
        <span class="w-px h-4 bg-neutral-200 dark:bg-white/10 mx-0.5 hidden sm:block" aria-hidden="true" />
        <UButton
          icon="i-lucide-settings-2"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Settings"
          class="rounded-full size-8 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10"
          @click="menuModal.open()"
        />
      </div>
    </div>
  </header>
</template>
