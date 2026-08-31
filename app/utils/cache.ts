import { get, set } from "idb-keyval";
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

export async function getWrappedDEK(key: string): Promise<string | undefined> {
  return (await get(`${WRAPPED_PREFIX}${key}`)) as string | undefined;
}

export async function setWrappedDEK(key: string, wrapped: string): Promise<void> {
  await set(`${WRAPPED_PREFIX}${key}`, wrapped);
}

export async function cacheAccountsFromServer(accounts: CipherAccount[], meta: { version: number; updatedAt: string }, order?: string[]): Promise<void> {
  const map: Record<string, CipherAccount> = {};
  for (const acc of accounts) map[acc.id] = acc;
  await setCache({ version: meta.version, updatedAt: meta.updatedAt, map, order });
}
