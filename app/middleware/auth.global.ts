import { onlineNow } from "~/utils/offline";

export default defineNuxtRouteMiddleware(async (to) => {
  const { isUnlocked } = useEncryption();
  const setupComplete = useState<boolean | null>("setupComplete", () => null);

  // 1. Vault unlocked (DEK in memory) → authorized
  if (isUnlocked.value) {
    if (to.path === "/login" || to.path === "/setup") {
      return navigateTo("/");
    }
    return;
  }

  // 2. Offline + locked → only /login (unlock via cached wrappedDEK)
  if (!onlineNow()) {
    if (to.path !== "/login") {
      return navigateTo("/login");
    }
    return;
  }

  // 3. Online: fetch setup status if unknown
  if (setupComplete.value === null) {
    try {
      const status = await $fetch<{ setupComplete: boolean }>(
        "/api/auth/status",
      );
      setupComplete.value = Boolean(status?.setupComplete);
    } catch {
      // Network error → fail-safe to /login
      if (to.path !== "/login") {
        return navigateTo("/login");
      }
      return;
    }
  }

  // 4. Setup incomplete → only /setup allowed
  if (!setupComplete.value) {
    if (to.path !== "/setup") {
      return navigateTo("/setup");
    }
    return;
  }

  // 5. Setup complete → /setup not allowed
  if (to.path === "/setup") {
    return navigateTo("/login");
  }

  // 6. Vault locked → enforce /login (also serves as unlock view on reload)
  if (to.path !== "/login") {
    return navigateTo("/login");
  }
});
