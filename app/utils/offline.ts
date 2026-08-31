import { toast } from "@steveyuowo/vue-hot-toast";

// Best-effort online check. navigator.onLine is instant; a fetch ping is more
// accurate but costs a request, so we keep it cheap and rely on fetch errors too.
export function onlineNow(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

// Guard for write operations (offline is read-only). Returns true when online.
// When offline, shows a friendly toast and prevents the write.
export function ensureOnline(action = "save changes"): boolean {
  if (!onlineNow()) {
    toast.error(`You're offline. Can't ${action} right now. Please reconnect.`);
    return false;
  }
  return true;
}
