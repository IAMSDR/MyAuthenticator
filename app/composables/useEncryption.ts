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

  // Offline unlock — unwrap DEK from the IndexedDB-cached wrapped copy using the
  // password, without any network call. Returns true on success. No raw DEK is ever
  // persisted; the wrapped value was cached during a prior online login/setup.
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

  // Offline unlock via a passkey PRF secret against the cached wrapped copy for a
  // specific credentialId (`wrappedDEK:prf:{credentialId}`). Falls back to the
  // generic `wrappedDEK:prf` key when no credentialId is known.
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

  // Clear on logout / beforeunload
  if (import.meta.client) {
    const onBeforeUnload = () => clearDEK();
    onMounted(() => window.addEventListener("beforeunload", onBeforeUnload));
    onUnmounted(() => window.removeEventListener("beforeunload", onBeforeUnload));
  }

  return { dek, isUnlocked, setDEK, clearDEK, decryptAccounts, encryptSecret, unlockWithPassword, unlockWithPrf };
};
