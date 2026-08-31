import * as nodeCrypto from "node:crypto";

const getSubtle = (): SubtleCrypto => {
  if (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    return window.crypto.subtle;
  }
  if (nodeCrypto.webcrypto && nodeCrypto.webcrypto.subtle) {
    return nodeCrypto.webcrypto.subtle as unknown as SubtleCrypto;
  }
  throw new Error("SubtleCrypto is not available in this environment (ensure you are on localhost or HTTPS)");
};

const getRandomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  if (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.getRandomValues) {
    return globalThis.crypto.getRandomValues(bytes);
  }
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    return window.crypto.getRandomValues(bytes);
  }
  if (nodeCrypto.webcrypto && nodeCrypto.webcrypto.getRandomValues) {
    return nodeCrypto.webcrypto.getRandomValues(bytes) as Uint8Array;
  }
  return nodeCrypto.randomBytes(length);
};

export const importKeyFromBytes = async (bytes: Uint8Array): Promise<CryptoKey> => {
  const subtle = getSubtle();
  return await subtle.importKey(
    "raw",
    bytes as unknown as BufferSource,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
};

export const importKeyFromBase64 = async (b64: string): Promise<CryptoKey> => {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return await importKeyFromBytes(bytes);
};

export const exportKeyToBase64 = async (key: CryptoKey): Promise<string> => {
  const subtle = getSubtle();
  const raw = await subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
};

export const generateDEK = async (): Promise<{ raw: Uint8Array; key: CryptoKey; b64: string }> => {
  const raw = getRandomBytes(32);
  const key = await importKeyFromBytes(raw);
  const b64 = btoa(String.fromCharCode(...raw));
  return { raw, key, b64 };
};

const generateKey = async (salt: Uint8Array, password: string) => {
  const subtle = getSubtle();
  const encoder = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const key = await subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  return key;
};

export const encryptWithPassword = async (data: string, password: string) => {
  const subtle = getSubtle();
  const encoder = new TextEncoder();
  const salt = getRandomBytes(16);
  const iv = getRandomBytes(12);
  const key = await generateKey(salt, password);
  const encryptedData = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as BufferSource,
    },
    key,
    encoder.encode(data)
  );
  const combinedBuffer = new Uint8Array(
    salt.length + iv.length + encryptedData.byteLength
  );
  combinedBuffer.set(salt, 0);
  combinedBuffer.set(iv, salt.length);
  combinedBuffer.set(new Uint8Array(encryptedData), salt.length + iv.length);
  const combinedBase64 = btoa(String.fromCharCode(...combinedBuffer));
  return combinedBase64;
};

export const decryptWithPassword = async (data: string, password: string) => {
  const subtle = getSubtle();
  const combinedBuffer = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  const salt = combinedBuffer.slice(0, 16);
  const iv = combinedBuffer.slice(16, 28);
  const encryptedData = combinedBuffer.slice(28);
  const key = await generateKey(salt, password);
  const decryptedData = await subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as BufferSource,
    },
    key,
    encryptedData as unknown as BufferSource
  );
  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
};

export const importKey = async (keyString: string) => {
  const subtle = getSubtle();
  const keyData = new TextEncoder().encode(keyString);
  const key = await subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
  return key;
};

export const encryptWithKey = async (data: string, key: CryptoKey) => {
  const subtle = getSubtle();
  const encoder = new TextEncoder();
  const iv = getRandomBytes(12);
  const encryptedData = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as BufferSource,
    },
    key,
    encoder.encode(data)
  );
  const combinedBuffer = new Uint8Array(iv.length + encryptedData.byteLength);
  combinedBuffer.set(iv, 0);
  combinedBuffer.set(new Uint8Array(encryptedData), iv.length);
  const combinedBase64 = btoa(String.fromCharCode(...combinedBuffer));
  return combinedBase64;
};

export const decryptWithKey = async (data: string, key: CryptoKey) => {
  const subtle = getSubtle();
  if (typeof data !== "string" || !/^[A-Za-z0-9+/=_-]+$/.test(data) || data.length % 4 !== 0) {
    throw new Error(`Invalid base64 secret (length ${String(data)?.length ?? 0})`);
  }
  let b64 = data;
  if (b64.includes("-") || b64.includes("_")) b64 = b64.replace(/-/g, "+").replace(/_/g, "/");
  const combinedBuffer = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  if (combinedBuffer.length < 13) throw new Error("Ciphertext too short");
  const iv = combinedBuffer.slice(0, 12);
  const encryptedData = combinedBuffer.slice(12);
  const decryptedData = await subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv as unknown as BufferSource,
    },
    key,
    encryptedData as unknown as BufferSource
  );
  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
};
