import { getWrappedDEK } from "~/utils/cache";
import { onlineNow } from "~/utils/offline";

export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn } = useUserSession();
  const setupComplete = useState<boolean | null>("setupComplete", () => null);

  // If user is already logged in, setup is guaranteed complete
  if (loggedIn.value) {
    setupComplete.value = true;
    if (to.path === "/login" || to.path === "/setup") {
      return navigateTo("/");
    }
    return;
  }

  // Offline path: allow access so the user can unlock the cached vault locally.
  // A cached wrapped DEK means a prior online login/setup stored it.
  if (!onlineNow()) {
    if (to.path === "/") {
      const hasWrapped = Boolean((await getWrappedDEK("password")) || (await getWrappedDEK("prf")));
      if (hasWrapped) return;
    }
    if (to.path !== "/login") {
      return navigateTo("/login");
    }
    return;
  }

  // Online & not logged in: check setupComplete only if not already cached in memory
  if (setupComplete.value === null) {
    try {
      const status = await $fetch<{ setupComplete: boolean }>("/api/auth/status");
      setupComplete.value = Boolean(status?.setupComplete);
    } catch {
      // If network fails to fetch status, assume setup is complete and let auth flow continue
      setupComplete.value = true;
    }
  }

  // Setup is not complete -> only /setup is allowed
  if (!setupComplete.value) {
    if (to.path !== "/setup") {
      return navigateTo("/setup");
    }
    return;
  }

  // Setup is complete -> /setup is not allowed
  if (to.path === "/setup") {
    return navigateTo("/login");
  }

  // If not logged in and trying to access protected route -> go to /login
  if (to.path !== "/login") {
    return navigateTo("/login");
  }
});
