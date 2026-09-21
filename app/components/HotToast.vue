<script setup lang="ts">
defineProps<{
  message: string;
  type?: "success" | "error" | "loading" | "info" | "default";
  icon?: string;
  onCloseToast?: () => void;
}>();
</script>

<template>
  <div
    class="flex items-center bg-white text-[#101010] text-sm px-3 py-2 rounded-md shadow-md w-fit max-w-[min(480px,calc(100vw-2rem))] mx-auto cursor-pointer pointer-events-auto select-none"
    @click.prevent="onCloseToast?.()"
  >
    <div v-if="icon || type === 'success' || type === 'error' || type === 'loading'" class="flex items-center justify-center mr-2 shrink-0 -translate-y-[1.5px]">
      <div v-if="icon">
        <img
          :src="icon"
          :width="24"
          :height="24"
          alt="Toast Icon"
          class="size-6 object-contain"
        >
      </div>
      <div v-else-if="type === 'success'" class="hot-toast-checkmark" />
      <div v-else-if="type === 'error'" class="hot-toast-error" />
      <div v-else-if="type === 'loading'" class="hot-toast-loading" />
    </div>
    <div class="text-sm font-normal line-clamp-3 break-words">
      {{ message }}
    </div>
  </div>
</template>

<style scoped>
.hot-toast-checkmark {
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: #61d345;
  position: relative;
  transform: rotate(45deg);
  animation: checkmarkCircleAnimation 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  animation-delay: 0ms;
}
.hot-toast-checkmark:after {
  content: "";
  box-sizing: border-box;
  animation: checkmarkAnimation 0.2s ease-out forwards;
  opacity: 0;
  animation-delay: 100ms;
  position: absolute;
  border-right: 2px solid;
  border-bottom: 2px solid;
  border-color: #fff;
  bottom: 6px;
  left: 6px;
  height: 10px;
  width: 6px;
}
@keyframes checkmarkCircleAnimation {
  from {
    transform: scale(0) rotate(45deg);
    opacity: 0;
  }
  to {
    transform: scale(1) rotate(45deg);
    opacity: 1;
  }
}
@keyframes checkmarkAnimation {
  0% {
    height: 0;
    width: 0;
    opacity: 0;
  }
  40% {
    height: 0;
    width: 6px;
    opacity: 1;
  }
  100% {
    opacity: 1;
    height: 10px;
  }
}

.hot-toast-error {
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: #ff4b4b;
  position: relative;
  transform: rotate(45deg);
  animation: errorCircleAnimation 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  animation-delay: 0ms;
}
.hot-toast-error:after,
.hot-toast-error:before {
  content: "";
  animation: errorFirstLineAnimation 0.15s ease-out forwards;
  animation-delay: 100ms;
  position: absolute;
  border-radius: 3px;
  opacity: 0;
  background: #fff;
  bottom: 9px;
  left: 4px;
  height: 2px;
  width: 12px;
}
.hot-toast-error:before {
  animation: errorSecondLineAnimation 0.15s ease-out forwards;
  animation-delay: 150ms;
  transform: rotate(90deg);
}
@keyframes errorCircleAnimation {
  from {
    transform: scale(0) rotate(45deg);
    opacity: 0;
  }
  to {
    transform: scale(1) rotate(45deg);
    opacity: 1;
  }
}
@keyframes errorFirstLineAnimation {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes errorSecondLineAnimation {
  from {
    transform: scale(0) rotate(90deg);
    opacity: 0;
  }
  to {
    transform: scale(1) rotate(90deg);
    opacity: 1;
  }
}

.hot-toast-loading {
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 100%;
  border-right-color: rgba(0, 0, 0, 0.6);
  animation: loadingRotate 1s linear infinite;
}
@keyframes loadingRotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
