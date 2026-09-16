import { get, set, del, keys } from "idb-keyval";
import type { CipherAccount } from "../../shared/types";

export type AccountsCache = {
  version: number;
  updatedAt: string;
  map: Record<string, CipherAccount>;
  order?: string[];
};

const CACHE_KEY = "accounts:cache";
const WRAPPED_PREFIX = "wrappedDEK:";

export async function getCache(): Promise<AccountsCache | undefined> {
  return (await get(CACHE_KEY)) as AccountsCache | undefined;
}

export async function setCache(cache: AccountsCache): Promise<void> {
  await set(CACHE_KEY, cache);
}

export async function clearCache(): Promise<void> {
  await del(CACHE_KEY);
}

export async function getWrappedDEK(key: string): Promise<string | undefined> {
  return (await get(`${WRAPPED_PREFIX}${key}`)) as string | undefined;
}

export async function setWrappedDEK(key: string, wrapped: string): Promise<void> {
  await set(`${WRAPPED_PREFIX}${key}`, wrapped);
}

export async function clearAllLocalVaultData(): Promise<void> {
  try {
    const allKeys = await keys();
    for (const key of allKeys) {
      if (typeof key === "string" && (key === CACHE_KEY || key.startsWith(WRAPPED_PREFIX))) {
        await del(key);
      }
    }
  } catch (err) {
    console.error("Failed to clear local vault data:", err);
  }
}

export async function cacheAccountsFromServer(accounts: CipherAccount[], meta: { version: number; updatedAt: string }, order?: string[]): Promise<void> {
  const map: Record<string, CipherAccount> = {};
  for (const acc of accounts) map[acc.id] = acc;
  await setCache({ version: meta.version, updatedAt: meta.updatedAt, map, order });
}

/**
 * Optimistically upserts one or more accounts into IndexedDB cache.
 * Updates cache version and updatedAt if provided by the server response.
 */
export async function upsertCachedAccounts(
  accounts: CipherAccount[],
  version?: number,
  updatedAt?: string
): Promise<void> {
  const cached = (await getCache()) || {
    version: version ?? 0,
    updatedAt: updatedAt ?? new Date().toISOString(),
    map: {},
    order: [],
  };

  for (const acc of accounts) {
    cached.map[acc.id] = acc;
    if (cached.order && !cached.order.includes(acc.id)) {
      cached.order.unshift(acc.id);
    }
  }

  if (version !== undefined) cached.version = version;
  if (updatedAt) cached.updatedAt = updatedAt;

  await setCache(cached);
}

/**
 * Optimistically updates specific fields of a cached account in IndexedDB.
 */
export async function updateCachedAccountFields(
  id: string,
  fields: Partial<CipherAccount>,
  version?: number,
  updatedAt?: string
): Promise<void> {
  const cached = await getCache();
  if (!cached || !cached.map[id]) return;

  cached.map[id] = { ...cached.map[id], ...fields };
  if (version !== undefined) cached.version = version;
  if (updatedAt) cached.updatedAt = updatedAt;

  await setCache(cached);
}

/**
 * Optimistically deletes an account from the IndexedDB cache.
 */
export async function deleteCachedAccount(
  id: string,
  version?: number,
  updatedAt?: string
): Promise<void> {
  const cached = await getCache();
  if (!cached) return;

  delete cached.map[id];
  if (cached.order) {
    cached.order = cached.order.filter((item) => item !== id);
  }
  if (version !== undefined) cached.version = version;
  if (updatedAt) cached.updatedAt = updatedAt;

  await setCache(cached);
}
