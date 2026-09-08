<script setup lang="ts">
import { onKeyStroke } from "@vueuse/core";
import Add from "./Add.vue";
import Menu from "./Menu.vue";

const overlay = useOverlay();
const addModal = overlay.create(Add);
const menuModal = overlay.create(Menu);

const appConfig = useAppConfig();
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");

const toggleTheme = () => {
  colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};

const showSearchBar = useState("searchBar", () => false);
const searchQuery = useState("searchQuery", () => "");

const searchInputRef = ref<HTMLInputElement | null>(null);

const themeIcon = computed(() => {
  const icons = appConfig.ui.icons as Record<string, string> | undefined;
  return isDark.value
    ? (icons?.dark ?? "i-lucide-moon")
    : (icons?.light ?? "i-lucide-sun");
});

const searchIcon = computed(() => {
  const icons = appConfig.ui.icons as Record<string, string> | undefined;
  return icons?.search ?? "i-lucide-search";
});

const plusIcon = computed(() => {
  const icons = appConfig.ui.icons as Record<string, string> | undefined;
  return icons?.plus ?? "i-lucide-plus";
});

const closeIcon = computed(() => {
  const icons = appConfig.ui.icons as Record<string, string> | undefined;
  return icons?.close ?? "i-lucide-x";
});

const clearSearch = () => {
  searchQuery.value = "";
  searchInputRef.value?.focus();
};

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

// Escape closes search input focus when empty or clears search query
onKeyStroke("Escape", () => {
  if (searchQuery.value) {
    searchQuery.value = "";
  } else if (showSearchBar.value) {
    showSearchBar.value = false;
  }
});
</script>

<template>
  <header class="hidden md:block sticky top-0 z-30 w-full bg-white/75 dark:bg-neutral-950/65 backdrop-blur-xl backdrop-saturate-150 border-b border-neutral-200/60 dark:border-white/[0.08] transition-colors duration-200 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
    <div class="mx-auto flex h-[58px] max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
      <!-- Left spacer: Balances the right actions so center search is truly centered -->
      <div class="flex-1 min-w-0" />

      <!-- Center: Refined search bar -->
      <div class="w-full max-w-[480px] shrink-0">
        <div class="relative w-full group">
          <UIcon
            :name="searchIcon"
            class="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400 dark:text-neutral-500 group-focus-within:text-(--ui-primary) transition-colors duration-150 pointer-events-none"
          />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Search authenticators..."
            class="w-full h-9 pl-9.5 pr-12 rounded-full bg-neutral-100/70 dark:bg-white/[0.05] border border-neutral-200/60 dark:border-white/[0.07] hover:bg-neutral-100/90 dark:hover:bg-white/[0.08] hover:border-neutral-300/70 dark:hover:border-white/10 focus:bg-white dark:focus:bg-neutral-900 focus:border-(--ui-primary)/40 focus:ring-2 focus:ring-(--ui-primary)/20 text-[13px] leading-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none transition-all duration-150"
          >

          <!-- Clear button when typing -->
          <button
            v-if="searchQuery"
            type="button"
            aria-label="Clear search"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 size-5 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/70 dark:hover:bg-white/10 transition-colors cursor-pointer"
            @click="clearSearch"
          >
            <UIcon :name="closeIcon" class="size-3.5" />
          </button>

          <!-- Keyboard shortcut badge when empty -->
          <div
            v-else
            class="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center pointer-events-none"
          >
            <span class="inline-flex items-center gap-0.5 rounded-full bg-neutral-200/60 dark:bg-neutral-800 border border-neutral-300/40 dark:border-white/10 px-1.5 py-0.5 shadow-2xs">
              <kbd class="text-[10px] font-medium leading-none tracking-tight text-neutral-500 dark:text-neutral-400 font-sans">⌘K</kbd>
            </span>
          </div>
        </div>
      </div>

      <!-- Right: Action Buttons -->
      <div class="flex-1 flex items-center justify-end gap-2 shrink-0">
        <!-- Add Button: Nuxt UI Soft Primary Button -->
        <UTooltip text="Add account">
          <UButton
            :icon="plusIcon"
            variant="soft"
            color="primary"
            size="sm"
            label="Add"
            class="rounded-full h-8.5 px-3.5 font-semibold text-[13px] cursor-pointer active:scale-95 transition-all"
            @click="addModal.open()"
          />
        </UTooltip>

        <!-- Subtle Divider -->
        <span class="w-px h-4 bg-neutral-200 dark:bg-white/10 mx-0.5 hidden sm:block" aria-hidden="true" />

        <!-- Theme Toggle Button (Dark / Light) -->
        <UTooltip :text="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
          <UButton
            :icon="themeIcon"
            color="neutral"
            variant="ghost"
            size="sm"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            class="rounded-full size-8.5 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            @click="toggleTheme"
          />
        </UTooltip>

        <!-- Settings Button -->
        <UTooltip text="Settings & Menu">
          <UButton
            icon="i-lucide-settings-2"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Settings"
            class="rounded-full size-8.5 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            @click="menuModal.open()"
          />
        </UTooltip>
      </div>
    </div>
  </header>
</template>
