export default defineAppConfig({
  ui: {
    primary: "green",
    container: {
      padding: "py-0 px-2 sm:px-5 lg:px-8",
    },
    modal: {
      overlay: {
        background: "bg-gray-200/75 dark:bg-gray-950/75 backdrop-blur-sm",
      },
      padding: "p-0",
      rounded: "rounded-t-2xl rounded-b-none sm:rounded-lg",
      width: "w-full max-w-md sm:max-w-md sm:w-full",
      height: "h-max",
      base: "relative text-left rtl:text-right flex flex-col p-4 sm:px-8",
    },
    formGroup: {
      wrapper: "w-full mt-4",
      size: {
        xl: "text-sm",
      },
    },
    button: {
      padding: {
        xl: "px-5 py-1.5",
      },
      rounded: "rounded-lg",
    },
    card: {
      body: {
        padding: "",
        base: "",
      },
      base: "w-full max-w-xs overflow-hidden",
    },
    dropdown: {
      background: "bg-white dark:bg-gray-900/90",
    },
  },
});
