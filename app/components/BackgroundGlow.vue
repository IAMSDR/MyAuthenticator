<script setup lang="ts">
import { useMouse } from "@vueuse/core";

const { x, y } = useMouse({ touch: false });

const glowX = ref(50);
const glowY = ref(30);

if (import.meta.client) {
  watch([x, y], ([newX, newY]) => {
    if (newX !== 0 || newY !== 0) {
      glowX.value = Math.round((newX / window.innerWidth) * 100);
      glowY.value = Math.round((newY / window.innerHeight) * 100);
    }
  });
}
</script>

<template>
  <div class="fixed inset-0 pointer-events-none overflow-hidden select-none -z-10 bg-white dark:bg-neutral-950">
    <!-- Cursor glow adapting to dark / light theme -->
    <div
      class="absolute inset-0 transition-[background] duration-200 ease-out"
      :style="{
        background: `radial-gradient(600px circle at ${glowX}% ${glowY}%, var(--glow-color, rgba(34, 197, 94, 0.08)), transparent 75%)`
      }"
    />

    <!-- Ambient top glow -->
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.04),transparent_60%)]" />

    <!-- Dot matrix texture -->
    <div
      class="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
      style="background-image: radial-gradient(circle, currentColor 1px, transparent 1px); background-size: 24px 24px;"
    />
  </div>
</template>
