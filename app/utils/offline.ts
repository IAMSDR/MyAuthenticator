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

  // $fetch/ofetch wraps HTTP responses in a FetchError with status/statusCode.
  // Anything carrying a server response is NOT a transport failure.
  if (err?.response || err?.statusCode || err?.status) return false;

  // Only classify known transport-layer failures as network errors. Other
  // exceptions (WebAuthn DOMExceptions, TypeErrors from bad options, crypto
  // errors, etc.) must surface their real message instead of "You're offline".
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
