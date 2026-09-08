import type { Icon } from "../types";

const SEARCH_PREFIX = "icon-search:";
const NAME_PREFIX = "icon-name:";
const MAX_CACHED_QUERIES = 100;
const MAX_CACHED_ICONS = 300;

type IDB = typeof import("idb-keyval");

let idb: IDB | null = null;
async function idbMod(): Promise<IDB | null> {
  try {
    if (typeof indexedDB === "undefined") return null;
    if (!idb) idb = await import("idb-keyval");
    return idb;
  } catch {
    return null;
  }
}

const norm = (q: string) => q.trim().toLowerCase();
type Wrapped<T> = { v: T; ts: number };

function unwrapSearch(raw: unknown): { icons: Icon[]; ts?: number } | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) return { icons: raw as Icon[] }; // legacy: raw Icon[]
  const w = raw as any;
  if (Array.isArray(w.icons)) return { icons: w.icons as Icon[], ts: w.ts };
  if (Array.isArray(w.v)) return { icons: w.v as Icon[], ts: w.ts };
  return undefined;
}

function unwrapIcon(raw: unknown): Icon | undefined {
  if (!raw) return undefined;
  const w = raw as any;
  if (w.icon && typeof w.icon === "string" && !w.v) return w as Icon; // legacy raw Icon
  if (w.v && w.v.icon) return w.v as Icon;
  return undefined;
}

function getTs(raw: unknown): number {
  const w = raw as any;
  return typeof w?.ts === "number" ? w.ts : 0;
}

export async function getCachedIconSearch(query: string): Promise<Icon[] | undefined> {
  const mod = await idbMod();
  if (!mod) return undefined;
  try {
    const raw = await mod.get(`${SEARCH_PREFIX}${norm(query)}`);
    const unwrapped = unwrapSearch(raw);
    return unwrapped?.icons;
  } catch {
    return undefined;
  }
}

export async function setCachedIconSearch(query: string, icons: Icon[]): Promise<void> {
  const mod = await idbMod();
  if (!mod) return;
  const now = Date.now();
  const slice = icons.slice(0, 30);
  try {
    await mod.set(`${SEARCH_PREFIX}${norm(query)}`, { v: slice, icons: slice, ts: now } as any);
    for (const icon of slice) {
      if (icon?.icon) {
        try {
          await mod.set(`${NAME_PREFIX}${icon.icon}`, { v: icon, ts: now } as Wrapped<Icon>);
        } catch {}
      }
    }
    await pruneByTs(mod, SEARCH_PREFIX, MAX_CACHED_QUERIES);
    await pruneByTs(mod, NAME_PREFIX, MAX_CACHED_ICONS);
  } catch {}
}

export async function getCachedIconByName(name: string): Promise<Icon | undefined> {
  const mod = await idbMod();
  if (!mod || !name) return undefined;
  try {
    const raw = await mod.get(`${NAME_PREFIX}${name}`);
    return unwrapIcon(raw);
  } catch {
    return undefined;
  }
}

export async function rememberIcon(icon: Icon): Promise<void> {
  const mod = await idbMod();
  if (!mod || !icon?.icon) return;
  try {
    await mod.set(`${NAME_PREFIX}${icon.icon}`, { v: icon, ts: Date.now() } as Wrapped<Icon>);
    await pruneByTs(mod, NAME_PREFIX, MAX_CACHED_ICONS);
  } catch {}
}

/** Offline fallback for matchIcon(): substring scan over remembered icons. */
export async function findCachedIconMatch(query: string): Promise<string | undefined> {
  const mod = await idbMod();
  if (!mod) return undefined;
  const q = norm(query);
  if (!q) return undefined;
  try {
    const exact = await getCachedIconSearch(q);
    if (exact?.length) return exact[0]?.icon;
    const all = await mod.keys();
    for (const k of all) {
      if (typeof k !== "string" || !k.startsWith(NAME_PREFIX)) continue;
      const icon = unwrapIcon(await mod.get(k));
      if (!icon?.icon) continue;
      const hay = `${icon.label ?? ""} ${icon.icon} ${icon.description ?? ""}`.toLowerCase();
      if (hay.includes(q)) return icon.icon;
    }
  } catch {}
  return undefined;
}

async function pruneByTs(mod: IDB, prefix: string, max: number): Promise<void> {
  try {
    const all = await mod.keys();
    const target = all.filter((k): k is string => typeof k === "string" && k.startsWith(prefix));
    if (target.length <= max) return;
    const withTs: Array<{ k: string; ts: number }> = [];
    for (const k of target) {
      try {
        const raw = await mod.get(k);
        withTs.push({ k, ts: getTs(raw) });
      } catch {
        withTs.push({ k, ts: 0 });
      }
    }
    withTs.sort((a, b) => a.ts - b.ts);
    const toDelete = withTs.slice(0, withTs.length - max);
    for (const { k } of toDelete) await mod.del(k);
  } catch {}
}
