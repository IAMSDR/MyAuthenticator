export default defineAppConfig({
  ui: {
    colors: {
      primary: "green",
      neutral: "neutral",
    },
    icons: {
      close: "i-lucide-x",
      arrowLeft: "i-lucide-arrow-left",
    },
    separator: {
      slots: {
        label: "text-xs font-mono text-neutral-400 dark:text-neutral-500",
      },
    },
    card: {
      slots: {
        root: "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm divide-y divide-neutral-200 dark:divide-neutral-800",
        header: "p-4 sm:p-5",
        body: "p-5 sm:p-6",
        footer: "p-4 sm:p-5",
      },
    },
    button: {
      slots: {
        base: "cursor-pointer font-medium transition-colors duration-150",
      },
    },
    input: {
      slots: {
        root: "w-full",
      },
    },
    formField: {
      slots: {
        label: "text-sm font-medium text-neutral-900 dark:text-neutral-100",
        description: "text-xs text-neutral-500 dark:text-neutral-400",
      },
    },
    modal: {
      slots: {
        overlay: "bg-neutral-950/70 backdrop-blur-sm transition-opacity",
        content: "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg max-w-md w-[calc(100%-2rem)] shadow-xl",
        header: "p-5 pb-3 border-b border-neutral-200 dark:border-neutral-800",
        title: "text-base font-semibold text-neutral-900 dark:text-neutral-100",
        description: "text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed",
        body: "p-5 space-y-4",
        footer: "p-4 pt-3 flex justify-end gap-2 border-t border-neutral-200 dark:border-neutral-800",
      },
    },
    container: {
      base: "mx-auto w-full max-w-2xl px-4 sm:px-6",
    },
  },
  theme: {
    radius: 0.375,
    blackAsPrimary: false,
  },
});


