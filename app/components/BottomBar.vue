<script setup lang="ts">
import Add from "./Add.vue";
import Menu from "./Menu.vue";

const overlay = useOverlay();
const addModal = overlay.create(Add);
const menuModal = overlay.create(Menu);

const showSearchBar = useState("searchBar", () => false);
</script>

<template>
  <!-- Mobile-only floating bar -->
  <div
    class="md:hidden fixed inset-x-0 z-30 px-4"
    :style="{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }"
  >
    <!--
      Structure: two layers.
      1. Glass layer (absolute, overflow-hidden) — holds blur + gradient + rim light, clips bg effects to the pill shape.
      2. Content layer (relative, NOT clipped) — buttons + raised FAB, so the FAB can bulge above the top edge freely.
    -->
    <div class="relative h-[64px]">
      <!-- True frosted glass layer -->
      <div
        class="absolute inset-0 overflow-hidden rounded-[22px] border border-white/70 dark:border-white/[0.14] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]"
        aria-hidden="true"
      >
        <!-- Strong blur + transparent tint — content shows & blurs through -->
        <div
          class="absolute inset-0 backdrop-blur-2xl backdrop-saturate-150 bg-white/60 dark:bg-neutral-950/60"
        />
        <!-- Top rim light — accent tinted, subtle -->
        <div
          class="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent dark:via-primary-400/40"
        />
        <!-- Bottom inner shadow for depth -->
        <div
          class="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-black/[0.05] to-transparent dark:from-black/30"
        />
      </div>

      <!-- Content layer — not clipped, FAB can raise above -->
      <div class="relative flex items-center justify-between h-full px-3">
        <!-- Menu -->
        <button
          type="button"
          aria-label="Open menu"
          class="group flex items-center justify-center size-12 rounded-2xl text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.1] active:scale-90 transition-all duration-150 focus-visible:outline-none"
          @click="menuModal.open()"
        >
          <UIcon name="i-lucide-menu" class="size-[22px]" />
        </button>

        <!-- Add — raised gradient FAB, soft colored shadow -->
        <button
          type="button"
          aria-label="Add account"
          class="group relative flex items-center justify-center size-[54px] -mt-7 rounded-full bg-gradient-to-br from-primary-400 via-primary-600 to-primary-700 text-white active:scale-95 transition-all duration-150 focus-visible:outline-none ring-4 ring-white/70 dark:ring-neutral-950/70 shadow-lg shadow-primary-600/30 dark:shadow-primary-500/25"
          @click="addModal.open()"
        >
          <UIcon
            name="i-lucide-plus"
            class="size-[26px] stroke-[2.6] transition-transform duration-200 group-active:rotate-90 drop-shadow-sm"
          />
        </button>

        <!-- Search -->
        <button
          type="button"
          :aria-label="showSearchBar ? 'Close search' : 'Search'"
          :class="[
            'group flex items-center justify-center size-12 rounded-2xl active:scale-90 transition-all duration-150 focus-visible:outline-none',
            showSearchBar
              ? 'bg-primary-600/15 dark:bg-primary-400/20 text-primary-600 dark:text-primary-400'
              : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.1]',
          ]"
          @click="showSearchBar = !showSearchBar"
        >
          <UIcon
            :name="showSearchBar ? 'i-lucide-x' : 'i-lucide-search'"
            class="size-[22px]"
          />
        </button>
      </div>
    </div>
  </div>
</template>
