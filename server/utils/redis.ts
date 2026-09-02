import { Redis as UpstashRedis } from "@upstash/redis";
// NOTE: `ioredis` is Node-TCP only and pulls `node:string_decoder` / `node:net`
// which have no Cloudflare Workers polyfill (unenv throws
// "string_decoder.StringDecoder is not implemented yet").
// Keep it out of the Cloudflare bundle via lazy dynamic import.
let _IORedisCtor: typeof import("ioredis").default | null = null;
async function getIORedisCtor(): Promise<typeof import("ioredis").default> {
  if (_IORedisCtor) return _IORedisCtor;
  // `/* @vite-ignore */` prevents Vite/Rollup from pre-bundling this for CF preset
  const mod = await import(/* @vite-ignore */ "ioredis");
  _IORedisCtor = (mod as unknown as { default: typeof import("ioredis").default }).default ?? (mod as unknown as typeof import("ioredis").default);
  return _IORedisCtor;
}

type RedisClient = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, opts?: { ex?: number; nx?: boolean }) => Promise<string | null | unknown>;
  del: (...keys: string[]) => Promise<number>;
  hgetall: (key: string) => Promise<Record<string, string> | null>;
  hget: (key: string, field: string) => Promise<string | null>;
  hexists?: (key: string, field: string) => Promise<number>;
  hlen?: (key: string) => Promise<number>;
  hset: (key: string, fields: Record<string, string> | string, value?: string) => Promise<number | unknown>;
  hdel: (key: string, ...fields: string[]) => Promise<number>;
  hincrby: (key: string, field: string, increment: number) => Promise<number>;
  incrby?: (key: string, increment: number) => Promise<number>;
  keys?: (pattern: string) => Promise<string[]>;
  scan?: (cursor: number, opts?: { match?: string; count?: number }) => Promise<[string, string[]]>;
  multiExec?: (commands: [string, ...unknown[]][]) => Promise<unknown[]>;
};

let _redis: RedisClient | null = null;
let _isUpstash = false;

function createUpstashClient(url: string, token: string): RedisClient {
  const client = new UpstashRedis({ url, token, automaticDeserialization: false } as unknown as ConstructorParameters<typeof UpstashRedis>[0]);
  _isUpstash = true;
  return {
    get: (key) => client.get(key) as Promise<string | null>,
    set: (key, value, opts) => {
      const upstashOpts: Record<string, unknown> = {};
      if (opts?.ex) upstashOpts.ex = opts.ex;
      if (opts?.nx) upstashOpts.nx = opts.nx;
      if (Object.keys(upstashOpts).length) {
        return client.set(key, value, upstashOpts as never) as Promise<string | null>;
      }
      return client.set(key, value) as Promise<string | null>;
    },
    del: (...keys) => client.del(...keys) as Promise<number>,
    hgetall: (key) => client.hgetall(key) as Promise<Record<string, string> | null>,
    hget: (key, field) => client.hget(key, field) as Promise<string | null>,
    hexists: (key, field) => client.hexists(key, field) as Promise<number>,
    hlen: (key) => client.hlen(key) as Promise<number>,
    hset: (key: string, fields: Record<string, string> | string, value?: string) => {
      if (typeof fields === "string" && value !== undefined) {
        return client.hset(key, { [fields]: value }) as Promise<number>;
      }
      return client.hset(key, fields as Record<string, string>) as Promise<number>;
    },
    hdel: (key, ...fields) => client.hdel(key, ...fields) as Promise<number>,
    hincrby: (key, field, increment) => client.hincrby(key, field, increment) as Promise<number>,
    scan: async (cursor, opts) => {
      // Upstash scan via SCAN command
      const args: unknown[] = [cursor];
      if (opts?.match) args.push("MATCH", opts.match);
      if (opts?.count) args.push("COUNT", opts.count);
      const res = await (client as unknown as { scan: (...a: unknown[]) => Promise<unknown> }).scan(cursor, opts);
      // Upstash returns [cursor, keys]
      return res as [string, string[]];
    },
    keys: async (pattern) => {
      const res = await client.keys(pattern);
      return res as string[];
    },
    multiExec: async (commands) => {
      // Upstash REST: pipeline is the atomic transaction; returns per-command results.
      const normalize = (cmd: string, args: unknown[]): unknown[] => {
        if (cmd.toLowerCase() === "hset" && args.length === 3 && typeof args[1] === "string") {
          return [args[0], { [args[1] as string]: args[2] }];
        }
        return args;
      };
      const pipe = client.multi();
      for (const [cmd, ...args] of commands) {
        const nArgs = normalize(cmd, args);
        // @ts-expect-error dynamic command execution on client.multi()
        pipe[cmd.toLowerCase()](...nArgs);
      }
      const res = (await pipe.exec()) as unknown[];
      return res;
    },
  };
}

async function createIORedisClient(redisUrl: string): Promise<RedisClient> {
  const IORedis = await getIORedisCtor();
  const client = new IORedis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: false });
  _isUpstash = false;
  return {
    get: (key) => client.get(key),
    set: (key, value, opts) => {
      const args: unknown[] = [key, value];
      if (opts?.ex) args.push("EX", opts.ex);
      if (opts?.nx) args.push("NX");
      // @ts-expect-error dynamic ioredis arguments
      return client.set(...args);
    },
    del: (...keys) => client.del(...keys),
    hgetall: async (key) => {
      const res = await client.hgetall(key);
      return Object.keys(res).length === 0 ? null : res;
    },
    hget: (key, field) => client.hget(key, field),
    hexists: (key, field) => client.hexists(key, field),
    hlen: (key) => client.hlen(key),
    hset: (key, fields, value) => {
      if (typeof fields === "string" && value !== undefined) {
        return client.hset(key, fields, value);
      }
      return client.hset(key, fields as Record<string, string>);
    },
    hdel: (key, ...fields) => client.hdel(key, ...fields),
    hincrby: (key, field, increment) => client.hincrby(key, field, increment),
    scan: async (cursor, opts) => {
      const res = await client.scan(cursor.toString(), "MATCH", opts?.match ?? "*", "COUNT", opts?.count ?? 100);
      return [res[0], res[1]] as [string, string[]];
    },
    keys: (pattern) => client.keys(pattern),
    multiExec: async (commands) => {
      const multi = client.multi();
      for (const [cmd, ...args] of commands) {
        // @ts-expect-error dynamic command execution on client.multi()
        multi[cmd.toLowerCase()](...args);
      }
      const res = await multi.exec();
      if (!res) return [];
      // ioredis exec returns [error, result] tuples — throw on any command error.
      for (const r of res) {
        if (r && r[0]) throw r[0];
      }
      return res.map((r) => (r ? r[1] : null));
    },
  };
}

// Shared helper: run an atomic transaction and return per-command results.
export async function runTransaction(commands: [string, ...unknown[]][]): Promise<unknown[]> {
  const redis = await getRedis();
  if (redis.multiExec) return await redis.multiExec(commands);
  // Fallback (no pipeline support): run sequentially.
  const results: unknown[] = [];
  for (const [cmd, ...args] of commands) {
    const lc = cmd.toLowerCase();
    // @ts-expect-error dynamic method call on redis client fallback
    results.push(await (redis as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>)[lc](...args));
  }
  return results;
}

// Extract the HINCRBY value for `key field` from a transaction, by locating the
// matching command in the original `commands` list and reading its result index.
export function versionFromTransaction(results: unknown[], commands: [string, ...unknown[]][], key: string, field: string): number {
  for (let i = 0; i < commands.length; i++) {
    const c = commands[i];
    if (!c) continue;
    const cmd = String(c[0]).toLowerCase();
    if (cmd === "hincrby" && c[1] === key && c[2] === field) {
      const v = results[i];
      if (typeof v === "number" && Number.isInteger(v)) return v;
      return 0;
    }
  }
  return 0;
}

export async function getRedis(): Promise<RedisClient> {
  if (_redis) return _redis;
  const config = useRuntimeConfig();
  const upstashUrl = (config.upstashRedisRestUrl as string) || process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
  const upstashToken = (config.upstashRedisRestToken as string) || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
  const redisUrl = (config.redisUrl as string) || process.env.REDIS_URL || "";

  if (upstashUrl && upstashToken) {
    _redis = createUpstashClient(upstashUrl, upstashToken);
    return _redis;
  }
  if (redisUrl) {
    // IORedis is Node-only — on Cloudflare Workers this will throw with a clear
    // message instead of the cryptic `string_decoder` unenv error.
    if (typeof process !== "undefined" && (process as unknown as { env?: Record<string,string> }).env?.CF_PAGES) {
      throw createError({ statusCode: 500, message: "REDIS_URL (ioredis) is not supported on Cloudflare Workers. Use UPSTASH_REDIS_REST_URL + TOKEN." });
    }
    _redis = await createIORedisClient(redisUrl);
    return _redis;
  }
  // Fallback: try env upstash even if config empty (nitro runtime)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    _redis = createUpstashClient(process.env.UPSTASH_REDIS_REST_URL, process.env.UPSTASH_REDIS_REST_TOKEN);
    return _redis;
  }
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    _redis = createUpstashClient(process.env.KV_REST_API_URL, process.env.KV_REST_API_TOKEN);
    return _redis;
  }
  throw createError({ statusCode: 500, message: "Redis not configured. Set UPSTASH_REDIS_REST_URL+TOKEN or REDIS_URL" });
}

// Helpers
export const redisKeys = {
  setupComplete: "auth:setupComplete",
  passwordHash: "auth:passwordHash",
  prfSalt: "auth:prfSalt",
  dekPassword: "auth:dek:password",
  dekPrfPrefix: "auth:dek:prf:",
  accounts: "accounts",
  accountsMeta: "accounts:meta",
  accountsOrder: "accounts:order",
  folders: "folders",
  passkeys: "passkeys",
  challengePrefix: "auth:challenge:",
};

export function dekPrfKey(credentialId: string) {
  return `${redisKeys.dekPrfPrefix}${credentialId}`;
}
export function challengeKey(attemptId: string) {
  return `${redisKeys.challengePrefix}${attemptId}`;
}

export async function getAccountsMeta() {
  const redis = await getRedis();
  const meta = await redis.hgetall(redisKeys.accountsMeta);
  if (!meta || Object.keys(meta).length === 0) {
    // If accounts:meta is not set, derive count from accounts hash directly
    let actualCount = 0;
    try {
      if (redis.hlen) {
        actualCount = await redis.hlen(redisKeys.accounts);
      } else {
        const all = await redis.hgetall(redisKeys.accounts);
        actualCount = all ? Object.keys(all).length : 0;
      }
    } catch {}
    return {
      version: 0,
      updatedAt: new Date(0).toISOString(),
      count: actualCount,
    };
  }
  let count = parseInt(meta.count ?? "0", 10);
  if (isNaN(count) || count <= 0) {
    try {
      if (redis.hlen) {
        const actualCount = await redis.hlen(redisKeys.accounts);
        if (actualCount > 0) count = actualCount;
      }
    } catch {}
  }
  return {
    version: parseInt(meta.version ?? "0", 10),
    updatedAt: meta.updatedAt ?? new Date(0).toISOString(),
    count,
  };
}
