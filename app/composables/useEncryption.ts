import { getWrappedDEK } from "~/utils/cache";

export const useEncryption = () => {
  const dek = useState<CryptoKey | null>("dek", () => null);
  const isUnlocked = computed(() => dek.value !== null);

  const setDEK = (key: CryptoKey) => {
    dek.value = key;
  };

  const clearDEK = () => {
    dek.value = null;
  };

  const decryptAccounts = async (cipherAccounts: CipherAccount[]): Promise<Account[]> => {
    if (!dek.value) throw new Error("DEK not available");
    const key = dek.value;
    return await Promise.all(
      cipherAccounts.map(async (acc) => {
        try {
          const plainSecret = await decryptWithKey(acc.secret, key);
          return { ...acc, secret: plainSecret } as Account;
        } catch (err) {
          console.error(`Failed to decrypt account ${acc.id}:`, err);
          throw err;
        }
      })
    );
  };

  const encryptSecret = async (plainSecret: string): Promise<string> => {
    if (!dek.value) throw new Error("DEK not available");
    return await encryptWithKey(plainSecret, dek.value);
  };

  // Offline password unlock: unwrap cached wrappedDEK from IndexedDB (no network; raw DEK never persisted).
  const unlockWithPassword = async (password: string): Promise<boolean> => {
    const wrapped = await getWrappedDEK("password");
    if (!wrapped) return false;
    try {
      const b64DEK = await decryptWithPassword(wrapped, password);
      const key = await importKeyFromBase64(b64DEK);
      dek.value = key;
      return true;
    } catch {
      return false;
    }
  };

  // Offline PRF unlock: unwrap cached wrappedDEK:prf:{credentialId} (fallback to generic wrappedDEK:prf).
  const unlockWithPrf = async (prfSecret: Uint8Array, credentialId?: string): Promise<boolean> => {
    const wrapped =
      (credentialId ? await getWrappedDEK(`prf:${credentialId}`) : undefined) ??
      (await getWrappedDEK("prf"));
    if (!wrapped) return false;
    try {
      const prfKey = await importKeyFromBytes(prfSecret);
      const b64DEK = await decryptWithKey(wrapped, prfKey);
      const key = await importKeyFromBase64(b64DEK);
      dek.value = key;
      return true;
    } catch {
      return false;
    }
  };

  // Clear DEK on page unload via global beforeunload (avoids onMounted warning outside setup).
  if (import.meta.client) {
    // Deduplicate listener: module flag ensures single registration across ~10 call sites.
    const g = globalThis as unknown as { __dekBeforeUnloadRegistered?: boolean };
    if (!g.__dekBeforeUnloadRegistered) {
      g.__dekBeforeUnloadRegistered = true;
      window.addEventListener("beforeunload", () => {
        // Use useState directly to avoid stale ref closure.
        useState<CryptoKey | null>("dek", () => null).value = null;
      });
    }
  }

  return { dek, isUnlocked, setDEK, clearDEK, decryptAccounts, encryptSecret, unlockWithPassword, unlockWithPrf };
};
