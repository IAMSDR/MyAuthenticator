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
  <header class="sticky top-0 z-30 w-full border-b border-neutral-200/60 dark:border-neutral-800/60 bg-white/75 dark:bg-neutral-950/75 backdrop-blur-xl transition-all">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
      <!-- Left: Brand / Logo -->
      <div class="flex items-center gap-3 shrink-0">
        <NuxtLink to="/" class="flex items-center gap-3 text-neutral-900 dark:text-neutral-100 group">
          <div class="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500/15 via-primary-500/10 to-transparent text-primary-600 dark:text-primary-400 border border-primary-500/20 group-hover:border-primary-500/40 group-hover:shadow-sm group-hover:shadow-primary-500/10 transition-all duration-200">
            <UIcon name="i-heroicons-shield-check-solid" class="size-5" />
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-bold tracking-tight text-neutral-900 dark:text-white leading-none">MyAuthenticator</span>
            <span class="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 tracking-wider mt-0.5 hidden sm:inline-block">SECURE VAULT</span>
          </div>
        </NuxtLink>
      </div>

      <!-- Center: Refined Floating Search Bar (md+) -->
      <div class="hidden md:flex flex-1 max-w-lg items-center relative group">
        <UIcon
          name="i-heroicons-magnifying-glass-16-solid"
          class="absolute left-3.5 size-4 text-neutral-400 dark:text-neutral-500 group-focus-within:text-primary-500 transition-colors pointer-events-none"
        />
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          placeholder="Search authenticators by name or issuer..."
          class="w-full h-9 pl-9 pr-20 rounded-lg bg-neutral-100/80 dark:bg-neutral-900/80 border border-neutral-200/60 dark:border-neutral-800/60 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:bg-white dark:focus:bg-neutral-900 focus:border-primary-500/40 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all shadow-2xs"
        >
        <div class="absolute right-3 flex items-center gap-1 pointer-events-none">
          <kbd class="px-1.5 py-0.5 text-[10px] font-mono font-medium text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded shadow-2xs">Ctrl</kbd>
          <kbd class="px-1.5 py-0.5 text-[10px] font-mono font-medium text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded shadow-2xs">K</kbd>
        </div>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-2.5">
        <!-- Mobile Search Trigger -->
        <UButton
          icon="i-heroicons-magnifying-glass-16-solid"
          color="neutral"
          variant="ghost"
          size="sm"
          class="md:hidden cursor-pointer rounded-md"
          aria-label="Search"
          @click="showSearchBar = !showSearchBar"
        />

        <!-- Desktop Add Button with Accent -->
        <UButton
          icon="i-heroicons-plus-16-solid"
          color="primary"
          size="sm"
          class="hidden md:inline-flex font-semibold cursor-pointer rounded-md px-3.5 shadow-xs active:scale-95 transition-all"
          @click="addModal.open()"
        >
          Add Account
        </UButton>

        <!-- Menu / Settings Trigger -->
        <UButton
          icon="i-lucide-settings-2"
          color="neutral"
          variant="soft"
          size="sm"
          aria-label="Settings"
          class="cursor-pointer rounded-md"
          @click="menuModal.open()"
        />
      </div>
    </div>
  </header>
</template>
