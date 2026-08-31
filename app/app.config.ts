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
        root: "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xs divide-y divide-neutral-200 dark:divide-neutral-800",
        header: "p-4 sm:p-5",
        body: "p-5 sm:p-6",
        footer: "p-4 sm:p-5",
      },
    },
    button: {
      slots: {
        base: "cursor-pointer font-medium transition-colors duration-150 rounded-md",
      },
    },
    input: {
      slots: {
        root: "w-full",
      },
    },
    formField: {
      slots: {
        label: "text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-1",
        description: "text-xs text-neutral-500 dark:text-neutral-400 mt-0.5",
      },
    },
    modal: {
      slots: {
        overlay: "bg-neutral-950/40 dark:bg-neutral-950/60 backdrop-blur-xs transition-opacity duration-200",
        content: "bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800/90 rounded-lg max-w-lg w-[calc(100%-2rem)] shadow-2xl shadow-neutral-950/20",
        header: "p-5 pb-3 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between",
        title: "text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight",
        description: "text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed",
        body: "p-5 space-y-4 max-h-[75vh] overflow-y-auto",
        footer: "p-4 pt-3 flex justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800/80",
      },
    },
    drawer: {
      slots: {
        overlay: "bg-neutral-950/40 dark:bg-neutral-950/60 backdrop-blur-xs transition-opacity duration-200",
        content: "bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 rounded-t-2xl shadow-2xl shadow-neutral-950/30",
        handle: "w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto my-3",
        header: "px-5 pb-3 border-b border-neutral-100 dark:border-neutral-800/80",
        title: "text-base font-bold text-neutral-900 dark:text-neutral-100",
        description: "text-xs text-neutral-500 dark:text-neutral-400 mt-0.5",
        body: "p-5 space-y-4 max-h-[80vh] overflow-y-auto",
        footer: "p-4 pt-3 flex justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800/80",
      },
    },
    container: {
      base: "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
    },
  },
  theme: {
    radius: 0.375,
    blackAsPrimary: false,
  },
});
