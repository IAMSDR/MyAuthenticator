import { onlineNow } from "~/utils/offline";

export default defineNuxtRouteMiddleware(async (to) => {
  const { isUnlocked } = useEncryption();
  const setupComplete = useState<boolean | null>("setupComplete", () => null);

  // 1. If vault is unlocked (DEK in memory), user is authorized for protected routes
  if (isUnlocked.value) {
    if (to.path === "/login" || to.path === "/setup") {
      return navigateTo("/");
    }
    return;
  }

  // 2. Offline path: if not unlocked, user must be on /login to unlock via cached wrapped DEK
  if (!onlineNow()) {
    if (to.path !== "/login") {
      return navigateTo("/login");
    }
    return;
  }

  // 3. Online path: Check setup status if not already known
  if (setupComplete.value === null) {
    try {
      const status = await $fetch<{ setupComplete: boolean }>(
        "/api/auth/status",
      );
      setupComplete.value = Boolean(status?.setupComplete);
    } catch {
      // On network/status error, fail safe to /login instead of assuming uninitialized setup
      if (to.path !== "/login") {
        return navigateTo("/login");
      }
      return;
    }
  }

  // 4. Setup is not complete -> only /setup is allowed
  if (!setupComplete.value) {
    if (to.path !== "/setup") {
      return navigateTo("/setup");
    }
    return;
  }

  // 5. Setup is complete -> /setup is not allowed
  if (to.path === "/setup") {
    return navigateTo("/login");
  }

  // 6. Vault is locked (whether loggedIn is true or false) -> enforce /login
  // This allows /login to act as the unlock view when user reloads or has an active session.
  if (to.path !== "/login") {
    return navigateTo("/login");
  }
});
