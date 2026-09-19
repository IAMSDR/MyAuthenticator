/**
 * PRF salts are stored as base64url strings (see server/api/auth/setup.post.ts).
 *
 * WebAuthn JSON options require binary extension values to be base64url strings
 * (e.g. `AuthenticationExtensionsPRFValuesJSON.first`), never raw bytes. Sending
 * an ArrayBuffer/Uint8Array produces `{}` after JSON serialization, which browsers
 * reject with a TypeError and Rust/WASM passkey providers reject with a serde
 * "invalid type: map" error.
 *
 * This normalizes any accepted representation into a base64url string.
 */
export function toBase64URL(value: string | Uint8Array | ArrayBuffer): string {
  if (typeof value === "string") {
    // Already base64 (url or standard). Normalize padding/url-safe alphabet.
    return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  // Runtime-agnostic base64url encoding (Node and Cloudflare Workers).
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
