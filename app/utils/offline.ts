import { toast } from "~/utils/toast";

export function onlineNow(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

export function offlineMessage(action = "save changes"): string {
  return `You're offline. Can't ${action} right now. Please reconnect.`;
}

export function isNetworkError(err: unknown): boolean {
  if (!err) return false;

  // The browser explicitly knows it is offline.
  if (!onlineNow()) return true;

  const e = err as { response?: unknown; statusCode?: unknown; status?: unknown; name?: unknown; message?: unknown };

  // FetchError with status/response = HTTP error, not transport failure.
  if (e.response || e.statusCode || e.status) return false;

  // Only transport failures = offline; WebAuthn/crypto/TypeErrors must surface real message.
  const name = e.name ?? "";
  if (name === "AbortError") return false;
  if (name === "TypeError" && /fetch|network|load failed/i.test(String(e.message ?? ""))) {
    return true;
  }
  return false;
}

export function getWriteErrorMessage(err: unknown, action = "save changes"): string {
  if (isNetworkError(err)) return offlineMessage(action);
  const e = err as { data?: { message?: string; statusMessage?: string }; message?: string };
  return e?.data?.message ?? e?.data?.statusMessage ?? e?.message ?? String(err);
}

// Simple browser check only — blocks writes instantly when offline.
export function ensureOnline(action = "save changes"): boolean {
  if (!onlineNow()) {
    toast.error(offlineMessage(action));
    return false;
  }
  return true;
}
