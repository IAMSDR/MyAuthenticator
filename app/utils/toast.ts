import { markRaw } from "vue";
import { toast as sonnerToast } from "vue-sonner";
import HotToast from "~/components/HotToast.vue";

export type ToastType = "success" | "error" | "loading" | "info" | "default";

export interface ToastOptions {
  id?: string | number;
  duration?: number;
  icon?: string;
}

export const showToast = (
  message: string,
  type: ToastType = "default",
  options?: ToastOptions,
) => {
  const customOptions: Record<string, any> = {
    type: type === "default" ? undefined : type,
    duration: options?.duration,
    componentProps: {
      message,
      type,
      icon: options?.icon,
    },
  };
  if (options?.id !== undefined) {
    customOptions.id = options.id;
  }

  return sonnerToast.custom(markRaw(HotToast), customOptions);
};

export const toast = {
  custom: showToast,
  loading: (message: string, options?: ToastOptions) =>
    showToast(message, "loading", options),
  success: (message: string, options?: ToastOptions) =>
    showToast(message, "success", options),
  error: (message: string, options?: ToastOptions) =>
    showToast(message, "error", options),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
};
