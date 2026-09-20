// Normalize PRF salt to base64url string for WebAuthn JSON (raw bytes serialize as {}).
export function toBase64URL(value: string | Uint8Array | ArrayBuffer): string {
  if (typeof value === "string") {
    return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
