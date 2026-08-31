import { onlineNow } from "~/utils/offline";

// Shared reactive offline state for the app shell / banners.
export const useOffline = () => {
  const isOffline = useState<boolean>("offline", () => false);

  const setOfflineState = (offline: boolean): void => {
    isOffline.value = offline;
  };

  // Keep the banner in sync with live connectivity changes (not just on load).
  if (import.meta.client) {
    const sync = () => setOfflineState(!onlineNow());
    onMounted(() => {
      window.addEventListener("online", sync);
      window.addEventListener("offline", sync);
    });
    onUnmounted(() => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    });
  }

  return { isOffline, setOfflineState, onlineNow };
};
