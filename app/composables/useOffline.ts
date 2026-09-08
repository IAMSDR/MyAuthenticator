import { onlineNow } from "~/utils/offline";

// Shared reactive offline state for the app shell / banners.
export const useOffline = () => {
  const isOffline = useState<boolean>("offline", () => false);

  const setOfflineState = (offline: boolean): void => {
    isOffline.value = offline;
  };

  // Keep the state in sync with live connectivity changes and auto-refresh on reconnection.
  if (import.meta.client) {
    const g = globalThis as unknown as { __offlineListenersRegistered?: boolean };
    if (!g.__offlineListenersRegistered) {
      g.__offlineListenersRegistered = true;

      const handleOnline = async () => {
        useState<boolean>("offline", () => false).value = false;
        // 1. Check for Service Worker updates to fetch latest UI/assets
        if ("serviceWorker" in navigator) {
          try {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) {
              await reg.update();
            }
          } catch (err) {
            console.debug("Service worker update check skipped:", err);
          }
        }
        // 2. Fetch fresh account data from server
        try {
          await refreshNuxtData("accounts");
        } catch (err) {
          console.debug("Accounts sync skipped:", err);
        }
      };

      const handleOffline = () => {
        useState<boolean>("offline", () => false).value = true;
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }
  }

  return { isOffline, setOfflineState, onlineNow };
};
