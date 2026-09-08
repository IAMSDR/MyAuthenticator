import { toast } from "@steveyuowo/vue-hot-toast";

export function onlineNow(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

export function offlineMessage(action = "save changes"): string {
  return `You're offline. Can't ${action} right now. Please reconnect.`;
}

export function isNetworkError(err: any): boolean {
  // $fetch/H3 errors have err.data / err.statusCode on HTTP responses.
  // Network failures (offline, captive portal, backend down) have neither.
  return !!err && !err?.data && !err?.response && !err?.statusCode && !err?.status;
}

export function getWriteErrorMessage(err: any, action = "save changes"): string {
  if (isNetworkError(err)) return offlineMessage(action);
  return err?.data?.message ?? String(err);
}

// Simple browser check only — blocks writes instantly when offline.
export function ensureOnline(action = "save changes"): boolean {
  if (!onlineNow()) {
    toast.error(offlineMessage(action));
    return false;
  }
  return true;
}
