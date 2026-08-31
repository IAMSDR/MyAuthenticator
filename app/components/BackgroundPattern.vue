<template>
  <div class="fixed inset-0 pointer-events-none overflow-hidden select-none -z-10 bg-neutral-50/50 dark:bg-neutral-950">
    <!-- Subtle top ambient light -->
    <div
      class="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,197,94,0.05),transparent_70%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,197,94,0.08),transparent_70%)]"
    />

    <!-- Dot matrix with radial mask so dots fade out softly towards edges -->
    <div
      class="absolute inset-0 opacity-40 dark:opacity-30 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]"
      style="background-image: radial-gradient(circle, currentColor 0.75px, transparent 0.75px); background-size: 20px 20px;"
    />
  </div>
</template>
