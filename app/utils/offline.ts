import { toast } from "~/utils/toast";

export function onlineNow(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

export function offlineMessage(action = "save changes"): string {
  return `You're offline. Can't ${action} right now. Please reconnect.`;
}

export function isNetworkError(err: any): boolean {
  if (!err) return false;

  // The browser explicitly knows it is offline.
  if (!onlineNow()) return true;

  // FetchError with status/response = HTTP error, not transport failure.
  if (err?.response || err?.statusCode || err?.status) return false;

  // Only transport failures = offline; WebAuthn/crypto/TypeErrors must surface real message.
  const name = err?.name ?? "";
  if (name === "AbortError") return false;
  if (name === "TypeError" && /fetch|network|load failed/i.test(String(err?.message ?? ""))) {
    return true;
  }
  return false;
}

export function getWriteErrorMessage(err: any, action = "save changes"): string {
  if (isNetworkError(err)) return offlineMessage(action);
  return err?.data?.message ?? err?.data?.statusMessage ?? err?.message ?? String(err);
}

// Simple browser check only — blocks writes instantly when offline.
export function ensureOnline(action = "save changes"): boolean {
  if (!onlineNow()) {
    toast.error(offlineMessage(action));
    return false;
  }
  return true;
}
