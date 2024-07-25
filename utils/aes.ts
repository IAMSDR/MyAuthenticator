import { subtle, getRandomValues } from "uncrypto";

const generateKey = async (salt: Uint8Array, password: string) => {
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
      salt: salt,
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
  const encoder = new TextEncoder();
  const salt = getRandomValues(new Uint8Array(16));
  const iv = getRandomValues(new Uint8Array(12));
  const key = await generateKey(salt, password);
  const encryptedData = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
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
  const combinedBuffer = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  const salt = combinedBuffer.slice(0, 16);
  const iv = combinedBuffer.slice(16, 28);
  const encryptedData = combinedBuffer.slice(28);
  const key = await generateKey(salt, password);
  const decryptedData = await subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encryptedData
  );
  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
};

export const importKey = async (keyString: string) => {
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
  const encoder = new TextEncoder();
  const iv = getRandomValues(new Uint8Array(12));
  const encryptedData = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
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
  const combinedBuffer = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  const iv = combinedBuffer.slice(0, 12);
  const encryptedData = combinedBuffer.slice(12);
  const decryptedData = await subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encryptedData
  );
  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
};
