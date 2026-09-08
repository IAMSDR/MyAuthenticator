# MyAuthenticator — Architecture Overhaul Plan (beta)

> Branch: `beta` (research only). Date: 2026-08-30. Consolidates decisions from findings + discussion. No code yet — this doc is source of truth before implementation.
> Update 2026-08-30: Redis-only (no Nuxthub), Upstash Redis / any Redis, Hash `accounts` + local cache + `version` sync.

## 1) Goals

- Remove env-based auth (`NUXT_AUTH_USERNAME`/`NUXT_AUTH_PASSWORD` in `nuxt.config.ts:17`) and optional `DB_ENCRYPTION_PASSWORD` server encryption.
- Move encryption to **client-side zero-knowledge-ish** via envelope encryption: generate a truly random `DEK` (data encryption key) on registration; `DEK` encrypts all `secret` fields via `shared/utils/aes.ts:80` `encryptWithKey`. User `password` and passkey PRF are `KEKs` that only wrap the `DEK`.
- Support **passkey as alternate unlock** (your requirement: passkey decrypts too) via **WebAuthn PRF/hmac-secret**, working cross-device via server-stored `auth:dek:prf:*` wrapper + IndexedDB wrapped-cache, not IndexedDB-only raw key.
- Remove **D1/Drizzle** (`server/database/schema.ts`, `drizzle.config.ts`, `server/utils/drizzle.ts`) and **Nuxthub** (`@nuxthub/core:0.8.18` `hub.kv:true`) entirely. Rely on **Redis only** (`@upstash/redis` REST for serverless/edge + `ioredis` for self-host) — deployable anywhere the user provides `REDIS_URL`/`UPSTASH_REDIS_REST_URL`+`TOKEN`. No `hubKV()` abstraction. See `upstash.com/docs/redis/features/restapi` `Hash` ✅ and `upstash.com/pricing` Free `500K` cmds `256MB`.
- Keep `NUXT_SESSION_PASSWORD` as only env for `nuxt-auth-utils` session cookie signing (standalone, not `hub` session).
- Keep PWA, TOTP/HOTP, backup/restore (independent backup password), theming.
- Add **local cache + version sync** for multi-device: don't `GET /api/accounts` every load; cache ciphertexts in `IndexedDB`/`localStorage` and sync via `accounts:meta {version, updatedAt}`.

## 2) Non-Goals

- Multi-user. Keep single-user (one `password` + N passkeys). No org/roles.
- Full OPAQUE/PAKE zero-knowledge (deferred). Password sent to server over HTTPS for hash verify (transient, not stored). Documented as acceptable for self-hosted single-user.
- Password reset/recovery. If all KEKs (password + every passkey PRF) lost, `DEK` unrecoverable => data loss. Only password change when unlocked (DEK in memory). No `POST /api/auth/reset` recovery path.
- `CF Workers KV` native support. Dropped with Nuxthub; Redis (Upstash REST) works on CF Workers (HTTP) too. KV path kept as git history.
- `Vercel Postgres/Neon` support. Redis-only covers requirement.

## 3) Current Architecture (for diff)

- **Auth:** `server/api/auth/login.post.ts:1` `readValidatedBody(loginSchema)` vs `useRuntimeConfig(event).AUTH_*`; `setUserSession({user:"ADMIN"})`. Middleware `app/middleware/auth.ts:1` redirects to `/login`. Passkeys in D1 `credentials` table (`schema.ts:23`) via `server/api/webauthn/*.ts`.
- **Data:** `useDrizzle().select().from(tables.accounts).all()` (`server/api/accounts/index.get.ts:4`). If `DB_ENCRYPTION_PASSWORD` set, server `importKey` + `decryptWithKey` per row; on POST `encryptWithKey` before insert. `period/counter` handling, `Tile.vue` generates TOTP via `otpauth`.
- **Backup/Restore:** `app/components/BackupAndRestore.vue:22` already client `encryptWithPassword/decryptWithPassword` for encrypted file, plus plaintext URI list. Keep independent backup password (not DEK).
- **Config:** `nuxt.config.ts:25` `hub: {database:true,kv:true}`. `drizzle.config.ts` `dialect:"sqlite"`, `shared/utils/aes.ts` both `Password (PBKDF2)` and `Key (AES-GCM raw)` helpers. `shared/types/index.ts:28` `loginSchema` username+password.

## 4) Target Architecture

### 4.1 High-level

```
[Browser Memory] DEK (CryptoKey, 256-bit random, useState, cleared on logout/beforeunload/tab close)
      ^ unwrap once per session
      |
      +--KEK_pw: PBKDF2 100k + AES-GCM (shared/utils/aes.ts:27) --> auth:dek:password (wrapped DEK)
      +--KEK_prf: PRF(hmac-secret) AES-GCM (shared/utils/aes.ts:80) --> auth:dek:prf:{credId} per passkey
      |
      +--hash (argon2/bcrypt via server)--> Redis auth:passwordHash (auth only, not KEK)
      |
      +--DEK --AES-GCM (iv 12B + ct)--> accounts Hash fields secret

[Server (Nitro, any Node/CF Worker/Vercel)] Redis only — no drizzle, no hubKV
   Redis keys: auth:passwordHash, auth:prfSalt, auth:dek:password, auth:dek:prf:{credentialId},
               accounts (Hash field->{uuid}=cipherAccount json), accounts:meta {version,updatedAt},
               accounts:order string[] (optional), folders string, passkeys string
   Upstash REST: @upstash/redis HTTP (CF Workers/edge) or ioredis TCP (self-host). Env UPSTASH_REDIS_REST_URL+TOKEN or REDIS_URL.
   IndexedDB/localStorage (client): ciphertext cache {version, map<id,cipherAccount>} + wrappedDEK cache (wrapped only, never raw DEK)
   No secrets / raw DEK plaintext on wire or at rest on server. Raw DEK never persisted anywhere.
```

Single random `DEK` is the data key; `password` and each passkey PRF are key-encryption-keys (KEKs) that wrap `DEK`. Hash in Redis is for login verification only.

### 4.2 Why Envelope (decisions you made)

- **Chosen:** random `DEK` + `KEK` wrapping over per-secret `encryptWithPassword` (`plan.md:49` Option A). Per-secret PBKDF2 was ~`N * 100k` derivations on every load (~2s/100 items) and password change required re-encrypting all accounts. Envelope: one `PBKDF2` unwrap + `N * AES-GCM` (~50ms), password change = re-wrap single `DEK`.
- **Cross-device fix retained:** store `wrappedDEK` on server `Redis` and cache wrapped copy in `IndexedDB` — any device fetches `auth:dek:prf:{id}` from `Redis` and unwraps with its locally derived `prfSecret` (`prfSalt` `auth:prfSalt` as `prf.eval.first` input).
- **Wrapped-only invariant:** never store raw `DEK` or `password` in `Redis`/`IndexedDB`/`localStorage`. `DEK` is generated via `crypto.getRandomValues(new Uint8Array(32))` and exported as `base64` only for wrapping.
- **Redis only** — removes `@nuxthub/core` multi-vendor abstraction; user provides `Upstash`/any `Redis` creds and deploys anywhere (CF Workers via `Upstash REST` HTTP, Vercel via `Upstash`, Docker/self-host via `ioredis`). See `upstash.com/docs/redis/features/restapi` `Hash`/`Transactions` ✅ and `upstash.com/pricing` Free `500K` cmds.

### 4.3 Why Redis Hash `accounts` (detail you asked)

Redis has 3 ways to store `100` accounts (`~50KB`):

| Model | Storage | `GET all` | `Edit 1` |
|-------|---------|-----------|----------|
| A. String coalesced | `SET accounts "[{id:1},{id:2},...]"` one JSON blob | `GET accounts` `1` cmd | `GET`→modify→`SET` `2` cmds rewrites `99` others |
| B. `account:{id}` per-key | `SET account:1 "{...}"` ... `SET account:100 "{...}"` | `SCAN 0 MATCH account:*` + `MGET` `2` cmds (`Redis` no `GETBY PREFIX`) | `SET account:2` `1` cmd but read was `2` |
| C. **Hash `accounts` ✅ chosen** | `HSET accounts 1 "{...}" 2 "{...}" ...` one key `accounts` with fields `uuid->json` | `HGETALL accounts` `{"1":"{...}",...}` `1` cmd `GET /hgetall/accounts` (`Hash ✅`) | `HSET accounts 2 "{new}"` `O(1)` touches one field `1` cmd, no `SCAN`+`MGET` |

`Hash` internally is `listpack` (≤512 fields) or `hashtable` — `100×500B` stays `listpack` ~`50KB` vs `100` separate keys duplicating prefix. `HGETALL` `O(N)` server-side contiguous, `HSET`/`HGET` `O(1)`. `Upstash REST` `max 10 MB` Free request, `1` `HGETALL` well under. `String`/`per-key` need `2` cmds for read; `Hash` is `1` + `1`.

For `5` sorting edits, don't `HSET` 5 fields — keep `accounts:order string[]` separate: `SET accounts:order "[...]"` + `HINCRBY accounts:meta version 1` `2` cmds in `1` `multi-exec` atomic (`Transactions` ✅) vs `5` `HSET`.

## 5) Data Model — Redis Only

Remove `server/database/schema.ts` entirely and `hubKV`. New keys in `Redis` (`@upstash/redis` or `ioredis`, `base` empty, colon prefix convention):

| Redis Key | Type | Value | Notes |
|-----------|------|-------|-------|
| `auth:setupComplete` | `String` | `"true"` or missing | If missing -> redirect to `/setup`. Replaces D1 existence check. |
| `auth:passwordHash` | `String` | `string` (argon2id hash) | Created on `/setup`. `bun:argon2` or `@node-rs/argon2` or `bcryptjs` (choose `argon2` with fallback `bcryptjs` for edge). Store `$argon2id$v=19$...`. Auth only. |
| `auth:prfSalt` | `String` | `base64url 32B` | Generated once on setup, used as `prf.eval.first` input for all passkeys. Rotate only on explicit wipe `wipe` flow. |
| `auth:dek:password` | `String` | `string` (base64 `iv12+ct`) | `encryptWithPassword(base64RawDEK, password)` (`shared/utils/aes.ts:27` `salt16+iv12+ct`). One entry. Replaced on password change. |
| `auth:dek:prf:{credentialId}` | `String` | `string` (base64 `iv12+ct`) | `encryptWithKey(base64RawDEK, prfKey)` (`shared/utils/aes.ts:80` `iv12+ct`) per passkey where `prfKey = importKeyFromBytes(prfSecret 32B)`. Deleted on passkey delete. |
| `accounts` | `Hash` | field `"{uuid}"`→`JSON string CipherAccount` | Each field is one account json: `{id, type, issuer, label, secret: ciphertext, algorithm, digits, period, counter, icon, createdAt, folderId?}`. `id` is `crypto.randomUUID()`. `secret` is `encryptWithKey(plaintext, DEK)` output (`iv12+ct` base64). Other fields plaintext (need for Tile without decrypt). `HGETALL accounts` returns `Map<id,json>` in `1` cmd. `HSET accounts {id} {json}` / `HDEL accounts {id}` touches one field. |
| `accounts:meta` | `Hash` | `{version: "int", updatedAt: "ISO", count: "int"}` | `version` is `HINCRBY` on every write (atomic with `HSET` via `multi-exec`). `updatedAt` is `ISO` string. Used for local cache sync. |
| `accounts:order` | `String` | `JSON string: string[] uuids` | Optional custom drag order. `GET`/`SET` one array, avoids `HSET` 5 fields on reorder. |
| `folders` | `String` | `JSON string: Folder[]` | `Folder {id, name, color, createdAt}`. Small array, `GET`/`SET`. Referenced by `CipherAccount.folderId`. |
| `passkeys` | `String` | `JSON string: StoredCredential[]` | Mirrors old `credentials` table: `{id, displayName, user:"admin", publicKey, counter, backedUp, transports}`. `publicKey` base64. |

Naming rationale: `auth:dek:*` groups KEK wrappers under `auth:` (`auth:passwordHash`, `auth:prfSalt`), allows `SCAN auth:dek:prf:*` or `KEYS`, short and project-consistent. `accounts` as `Hash` not `accounts:*` prefix avoids `SCAN`+`MGET` 2-step.

Zod schemas in `shared/types/index.ts` need `accountStorageSchema` (secret is ciphertext string `iv+ct` b64) vs `accountSchema` (secret is plaintext base32). Validate both. Also `accountsMetaSchema {version:number, updatedAt:string, count:number}` and `folderSchema`.

Size: Redis value limit `Upstash` `10 MB` Free request / `100 MB` record (`upstash.com/pricing`) — `accounts` `100` items `~50KB`, `HGETALL` well within. Wrapped DEK entries `~80 bytes` each. Free `500K` cmds/month ample: `HGETALL`+`meta` `2` cmds per sync.

Client cache (`app/utils/cache.ts` new, `idb-keyval` `IndexedDB` preferred over `localStorage` 5MB): `Cache {version:number, updatedAt:string, map: Record<id,CipherAccount>, order:string[]}` stored ciphertext only. `DEK` never cached.

## 6) Detailed Flows

### 6.1 First Visit — Setup

1. `app/middleware/auth.ts` + global middleware: `GET /api/auth/status` -> if `!setupComplete` -> `navigateTo('/setup')` (not `/login`).
2. `/setup` page: single password field + confirm + strength meter (reuse `loginSchema` password regex `shared/types/index.ts:28` or relax per your `will decide` — keep strong rule default). No username.
3. On submit: client generates `DEK`: `raw32 = crypto.getRandomValues(new Uint8Array(32))`, `DEK = await importKeyFromBytes(raw32)` (new helper `subtle.importKey('raw', bytes, 'AES-GCM', true, ['encrypt','decrypt'])`), export `b64DEK = base64(raw32)`, `wrappedPw = await encryptWithPassword(b64DEK, password)`. Send `password` + `wrappedPw` to `POST /api/auth/setup` (HTTPS). Server: if `setupComplete` exists -> 409. Else `hash = await argon2.hash(password)` -> `redis.set('auth:passwordHash', hash)`; `redis.set('auth:prfSalt', randomBase64url)`; `redis.set('auth:dek:password', wrappedPw)`; `redis.set('auth:setupComplete','true')`; `redis.hset('accounts:meta', {version:0, updatedAt: new Date().toISOString(), count:0})`; `redis.del('accounts')`; `setUserSession({user:"admin"})` return 200. Client then holds `DEK` (`CryptoKey`) in `useEncryptionKey()` memory (`useState('dek')`) and navigates `/`. Also `idb.set('wrappedDEK:password', wrappedPw)` cache (wrapped only). Init cache `idb.set('accounts:cache', {version:0, map:{}})`.
4. Auto-prompt passkey register after setup (optional).

### 6.2 Login — Password

1. `/login` (no username field). User enters `password`.
2. `POST /api/auth/login {password}` -> server checks rate limit (e.g. 10 attempts per 10m lockout); `hash = await redis.get('auth:passwordHash')`; `argon2.verify(hash, password)` -> if false 401; else `wrappedDEK = await redis.get('auth:dek:password')`; `setUserSession({user:"admin"})` return `200 {wrappedDEK}` (the raw DEK is never received or stored on the server). Wrap is also cached in IndexedDB as `wrappedDEK:password` if client prefers local cache path.
3. Client on 200: `b64DEK = await decryptWithPassword(wrappedDEK, password)` (`shared/utils/aes.ts:50`), `DEK = await importKeyFromBase64(b64DEK)` (decode base64 -> `importKeyFromBytes`), store `DEK` in `useState('dek')` memory (cleared `onUnmounted` + `beforeunload` + `logout` clears). Also `idb.set('wrappedDEK:password', wrappedDEK)` for next offline lookup (wrapped only). Then `GET /api/accounts/meta` check cache version (see 6.3 fast path) or `refreshNuxtData('accounts')`.
4. `GET /api/accounts/meta` -> `redis.hgetall('accounts:meta')` -> `{version, updatedAt, count}` (1 cmd `HGETALL` meta). Client compares `cached.version` (from `idb.get('accounts:cache')`) with `server.version`: if equal -> use cached `map` (no `/accounts` call). If stale/missing -> `GET /api/accounts` -> `redis.hgetall('accounts')` -> returns `Map<id,json>` values as array (1 cmd `HGETALL accounts`) + `redis.get('accounts:order')` if exists -> cache `idb.set('accounts:cache', {version, map})` and return ciphertext array as-is (no server decrypt).
5. `app/pages/index.vue:6` client loop: `for (a of data) a.secret = await decryptWithKey(a.secret, DEK)` (`shared/utils/aes.ts:98`) into computed `decryptedAccounts` (keep raw ciphertext cache for write-back). Cost: one PBKDF2 unwrap + N AES-GCM. Filtering by `folderId`/`order` uses cached `accounts:order` client-side.

### 6.3 Create / Edit / Delete Account + Sync

- **Create:** `Add.vue` / `Form.vue` creates plaintext `Account` -> client `account.secret = await encryptWithKey(secret, DEK)` (`shared/utils/aes.ts:80` `iv12+ct`) plus `id=crypto.randomUUID()` -> `POST /api/accounts {cipherAccount}`. Server checks existence and runs `multi-exec` atomic transaction with `HSET accounts`, conditional count increment, and version/updatedAt updates -> return `{version}`. Client updates `idb` cache `map[id]=cipher` and `version`, no full refetch.

- **Edit label/issuer/icon/folderId** (no `secret` touch): `PATCH /api/accounts/:id {fields}` -> server `HGET accounts {id}` -> merge plaintext fields -> `HSET accounts {id} {json}` + `HINCRBY accounts:meta version 1` in same `multi-exec` (`1` HTTP `2-3` cmds billed). Single-field `HSET` touches one `Hash` field, not `99` others. Return `version`.

- **Reorder 5 items:** `PATCH /api/accounts/order {order:[uuid...]}` -> `SET accounts:order json` + `HINCRBY accounts:meta version 1` `2` cmds `1` `multi-exec` (not 5 `HSET`). Client updates cached `order`.

- **Delete:** `DELETE /api/accounts/:id` -> `multi-exec` `[["HDEL","accounts",id],["HINCRBY","accounts:meta","version",1],["HINCRBY","accounts:meta","count",-1]]` (`HDEL` `O(1)`). Return `version`.

- **Cache sync multi-device:** Device B polls `GET /api/accounts/meta` on `focus`, `visibilitychange`, or `30s` interval. If `cached.version < server.version`, Device B does `GET /api/accounts` `HGETALL` and refreshes cache. No `accounts` call when `version` equal — saves `500K` quota.

Similarly `PATCH` (edit label/issuer/icon) does not re-encrypt `secret`; `DELETE` `HDEL`.

### 6.4 Passkey Register — PRF Wrap

Precondition: user unlocked (`DEK` in memory) + `prf` supported check `window.PublicKeyCredential.getClientCapabilities?.().prf` or try. If `prf` unsupported: register passkey normally as auth-only, no `auth:dek:prf:*` wrapper — login via that passkey will later require password (document UX).

1. `prfSalt = await redis.get('auth:prfSalt')` fetched on page load (`GET /api/auth/prf-salt` or via status).
2. `POST /api/webauthn/register` with `options.extensions.prf.eval.first = base64urlToBuffer(prfSalt)` (via `server/api/webauthn/register.post.ts` updated to forward extensions).
3. On success, browser returns `clientExtensionResults.prf.enabled` and on auth later provides `prf.results.first`.
4. Client derives `prfSecret = extensionResults.prf.results.first` (32B ArrayBuffer) -> `prfKey = await importKeyFromBytes(prfSecretBytes)` (new helper `shared/utils/aes.ts:68` variant for raw bytes via `subtle.importKey('raw', bytes, 'AES-GCM')`). Then `wrapped = await encryptWithKey(b64DEK, prfKey)` (use `aes.ts:80`; `b64DEK` exported from in-memory `DEK` via `exportKeyToBase64(DEK)`). Need `exportKeyToBase64` helper (`subtle.exportKey('raw', DEK)` -> base64).
5. `POST /api/webauthn/wrap {credentialId, wrappedDEK: wrapped}` -> `redis.set('auth:dek:prf:{credentialId}', wrapped)`.
6. Also `indexedDB.put('wrappedDEK:prf:{credentialId}', wrapped)` cache for fast unlock (wrapped only).

### 6.5 Passkey Login — Unwrap

1. User clicks `Login with Passkey` (`app/pages/login.vue:16` `useWebAuthn().authenticate()`), request with `extensions.prf.eval.first = prfSalt`.
2. Server returns `allowCredentials` + extension; browser authenticates, returns `prf.results.first` (32B) + assertion.
3. `POST /api/auth/passkey` verifies assertion (`server/api/webauthn/authenticate.post.ts`) -> if ok, does **not** need password hash check -> `setUserSession`. Return `{wrappedDEK: await redis.get('auth:dek:prf:{credentialId}')}` if exists (do not return raw `DEK`).
4. Client: if `wrappedDEK` present and `prfSecret` present -> `prfKey = await importKeyFromBytes(prfSecret)` -> `b64DEK = await decryptWithKey(wrappedDEK, prfKey)` -> `DEK = await importKeyFromBase64(b64DEK)` -> store in memory -> decrypt accounts via `meta` cache check as in 6.2.4.
5. If no wrapper (old passkey or prf unsupported) -> after session set, show `Enter password to decrypt` modal (fallback must still use `auth:dek:password` path).
6. Also cache `wrappedDEK` in IndexedDB (`wrappedDEK:prf:{credentialId}`) for next login fast path, but server remains source of truth for cross-device.

Cross-device: Device B fetches wrapper from server (`Redis`), not `IndexedDB`, so works even though Device B never cached. Wrapped-only cache means stolen device without PRF auth cannot obtain raw DEK.

### 6.6 Password Change (only when unlocked)

No recovery/reset. Requires `DEK` in memory (user already authenticated via password or passkey and `DEK` unwrapped).

Flow: authenticated user enters `newPassword` (and optionally `oldPassword` for re-verify). Client: `b64DEK = await exportKeyToBase64(DEK)`, `newWrapped = await encryptWithPassword(b64DEK, newPassword)`, `newHash =` server will compute (or client sends newPassword over HTTPS for server to hash). `POST /api/auth/change-password {newWrappedDEK: newWrapped, password: newPassword}` (HTTPS, server `argon2.hash(newPassword)`). Server verifies session (`requireUserSession`), then `redis.set('auth:passwordHash', newHash)` and `redis.set('auth:dek:password', newWrapped)`. Existing `auth:dek:prf:*` wrappers unchanged (same `DEK`, still valid). No account re-encryption. After success, update `idb` wrapped cache. If client has cached `prfSecret` for a passkey, may optionally re-wrap that passkey's entry too, but not required.

If user forgot password and has no valid passkey PRF wrapper, `DEK` unrecoverable => data loss (wipe via 6.7 required to re-setup).

### 6.7 Wipe (explicit, destructive)

Since zero-knowledge with DEK envelope and no recovery, provide explicit wipe only. No `POST /api/auth/reset` that silently re-creates hash. Provide `POST /api/auth/wipe` that when user confirms destructive reset (double confirm UI, requires session or manual `setupComplete` bypass with extra confirmation), `redis.del('accounts')`, `redis.del('auth:dek:password')`, deletes all `auth:dek:prf:*` (SCAN `auth:dek:prf:*` + `DEL` or `redis.keys` loop), `redis.del('passkeys')`, `redis.del('auth:passwordHash')`, `redis.del('auth:prfSalt')`, `redis.del('auth:setupComplete')`, `redis.del('accounts:meta')`, `redis.del('accounts:order')`, `redis.del('folders')` — irreversible; then user must go through `6.1 Setup` again which generates fresh `DEK`. Document clearly.

## 7) Redis-Only Implementation Notes (any Redis, Upstash REST)

- `nuxt.config.ts`: remove `hub: {database:true,kv:true}` and `@nuxthub/core` entirely. Keep `auth` config but session via `nuxt-auth-utils` standalone (requires `NUXT_SESSION_PASSWORD`). No `nitro.preset` hub. `runtimeConfig` only `NUXT_SESSION_PASSWORD`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` / `REDIS_URL`.
- **Redis setup:** User provides own Redis creds. Upstash: create DB at `console.upstash.com` → sets `UPSTASH_REDIS_REST_URL`+`TOKEN` (also `KV_REST_API_URL` alias on Vercel). Self-host: `REDIS_URL=redis://localhost:6379`. `server/utils/redis.ts`: `import {Redis} from '@upstash/redis'` for REST (edge/CF Workers) and fallback `ioredis` for TCP. `Upstash REST` supports `HGETALL`/`HSET`/`HDEL`/`HINCRBY`/`multi-exec` `Transactions` (`upstash.com/docs/redis/features/restapi` `REST API Pros` HTTP, not TCP, works on CF). Free `500K` cmds `256MB` `upstash.com/pricing`.
- **Local dev:** `pnpm dev` uses `Upstash` free DB or `docker run redis` + `.env` `REDIS_URL`. No `hubKV` FS fallback.
- Remove deps: `drizzle-orm`, `drizzle-kit`, `@nuxthub/core`, `long`? Keep `long` if protobuf needs. Update `package.json:24`.
- Replace `server/utils/drizzle.ts` with `server/utils/redis.ts`: `export const redis = new Redis(...)`; helpers `getMeta()`, `hgetallAccounts()`, `hsetAccount()`, `listPrfWrappers()` via `SCAN auth:dek:prf:*`. Add `getAccountsMeta()` for cache version.
- Atomicity: `Redis` `multi-exec` `HSET`+`HINCRBY` is atomic (Upstash `POST /multi-exec` `Transactions` ✅). `HSET` single field is `O(1)` no RMW of `99` others. `String` coalesced would be `GET`+`SET` race; `Hash` avoids it. For `5` reorders use `accounts:order` single key.
- Cache: `app/utils/cache.ts` + `idb-keyval` for `IndexedDB` `accounts:cache` `{version, map}` ciphertext only. `localStorage` alternative but `5MB` limit; `IndexedDB` preferred. On `focus`/`visibilitychange` poll `GET /api/accounts/meta` `1` `HGET` `accounts:meta` before full `HGETALL`.
- No migrations folder. Add `GET /api/migrate/d1-to-redis` one-time for existing users: if `D1` data still present (detect old binding), server reads D1, decrypts with old `DB_ENCRYPTION_PASSWORD` if needed, returns to client where client re-encrypts with new `DEK` then `HSET` per account + `HSET accounts:meta` (client-side migration). Delete D1 after.

## 8) File Change List

- **Delete:** `server/database/schema.ts`, `server/database/migrations/*`, `drizzle.config.ts`, `server/utils/drizzle.ts`
- **Modify:**
  - `nuxt.config.ts:17` `runtimeConfig` remove `AUTH_USERNAME`, `AUTH_PASSWORD`, `DB_ENCRYPTION_PASSWORD`; keep `NUXT_SESSION_PASSWORD` only. Remove `hub:{database:true,kv:true}` and `@nuxthub/core` module. Add `runtimeConfig.redisUrl`/`upstashUrl`+`token` env.
  - `shared/types/index.ts:28` `loginSchema` -> `passwordSchema` single field `z.string().min(8).regex(...)`; keep `passkeyUser` maybe remove. Add `cipherAccountSchema` (secret `iv+ct` b64) vs `accountSchema` (secret plaintext base32) + `accountsMetaSchema` + `folderSchema` + `cacheSchema`.
  - `shared/utils/aes.ts` add `generateDEK()`, `exportKeyToBase64(key: CryptoKey): Promise<string>`, `importKeyFromBytes(bytes: Uint8Array): Promise<CryptoKey>`, `importKeyFromBase64(b64: string): Promise<CryptoKey>` helpers for PRF and DEK. Keep `generateKey` for password wrap. Ensure `encryptWithKey/decryptWithKey` used for accounts + PRF wraps.
  - `server/api/auth/setup.(get|post).ts` new — status & create hash + store `auth:dek:password` + `auth:prfSalt` + `accounts:meta` init.
  - `server/api/auth/login.post.ts:1` replace env check with `redis.get('auth:passwordHash')` + `argon2.verify`, return `wrappedDEK`.
  - `server/api/auth/change-password.post.ts` new — re-wrap `auth:dek:password` when unlocked (replaces reset).
  - `server/api/auth/wipe.post.ts` new — destructive wipe (replaces `reset`) via `redis.del` + `SCAN auth:dek:prf:*`.
  - `server/api/auth/status.get.ts` new — returns `{setupComplete: boolean}` for middleware; add `GET /api/auth/prf-salt` and `GET /api/accounts/meta` `{version,updatedAt,count}`.
  - `server/api/accounts/index.*.ts` (get/post/patch/delete) rewrite to `Redis` `HGETALL`/`HSET`/`HDEL` + `multi-exec` `version` bump; `index.get.ts:5` remove `importKey` decrypt branch, now `encryptWithKey` with `DEK` client-side. Add `server/api/accounts/order.patch.ts` for `accounts:order`.
  - `server/api/webauthn/*.ts` add `prf` extension forwarding and `auth:dek:prf:*` handling; `passkeys.get.ts`/`delete.ts` also delete wrapper `auth:dek:prf:{id}`.
  - `app/middleware/auth.ts:1` add check `setupComplete` -> `/setup` else `loggedIn` -> `/login`.
  - `app/pages/setup.vue` new, generates `DEK` + `wrappedPw` client-side.
  - `app/pages/login.vue` remove username field, add IndexedDB wrapped-cache check to show/hide passkey button (`await idb.get` + `isConditionalMediationAvailable()`).
  - `app/pages/index.vue:6` client decrypt loop via `decryptWithKey(DEK)` + `useEncryptionKey` composable (`app/composables/useEncryption.ts` new, `useState('dek', ()=>null)` memory only, holds `CryptoKey` not `password` string) + `app/utils/cache.ts` version check (`GET /api/accounts/meta` before `GET /api/accounts`).
  - `app/components/BackupAndRestore.vue` keep independent backup password (already client `encryptWithPassword`); ensure it does not use `DEK` by default.
  - `README.md:59` env docs update (remove `AUTH_*`, `DB_ENCRYPTION_PASSWORD`, `hub` KV envs, add `UPSTASH_REDIS_REST_URL`+`TOKEN`/`REDIS_URL`, document wrapped-only + data-loss warning + `500K` Free tier).
- **Add:** `app/composables/useEncryption.ts`, `app/utils/cache.ts` (idb-keyval `accounts:cache` ciphertext + `wrappedDEK` cache), `app/utils/idb.ts` (idb-keyval wrapper), `server/utils/redis.ts`, `server/utils/hash.ts` (argon2).

## 9) Dependencies

- Remove: `drizzle-orm 0.40`, `drizzle-kit 0.30.5`, `@nuxthub/core 0.10.8`, `long` (if unused elsewhere), maybe `protobufjs` keep for Google import.
- Add: `@upstash/redis` (REST, edge/CF Workers) + `ioredis` (optional self-host TCP) + `argon2` (or `bcryptjs` for edge) + `idb-keyval` for IndexedDB `accounts:cache`. Optionally `uncrypto` already provides PBKDF2 — keep.
- Keep `nuxt-auth-utils 0.5.30`, `@simplewebauthn/*:13.3.0` with PRF, `nuxt 3.16.0`.
- Update `packageManager` to `pnpm@11.24.0` per `findings.md` (deferred but align).

## 10) Security Considerations

- Password transient on server during hash verify — not stored, HTTPS only, logs must not log body (disable).
- Hash with `argon2id` m=64MB t=3 p=1 or `bcrypt` cost 12. Not PBKDF2 alone (PBKDF2 100k kept for `auth:dek:password` wrapping via `aes.ts:16`, separate from hash).
- `auth:dek:password` and `auth:dek:prf:*` in Redis are `AES-GCM iv+ct` ciphertexts; server never sees `DEK` or `prfSecret`. `auth:prfSalt` stored plaintext in Redis is fine (PRF input, not secret).
- Memory-only `DEK` (`CryptoKey`) cleared on `logout`, `beforeunload`, tab close, `useEncryptionKey` not persisted to `localStorage`/`IndexedDB` raw; `IndexedDB` holds only wrapped strings + ciphertext cache.
- XSS: script can read memory `DEK` while tab open — mitigate with CSP, no `eval`, strict `Content-Security-Policy`.
- Passkey PRF not supported fallback must require password — never store raw `DEK` or password plaintext in Redis/IndexedDB.
- Wrapped-only invariant enforced: audit that no `redis.set` writes raw `DEK` and no `idb.set` writes raw `DEK`.
- Cache: `IndexedDB` `accounts:cache` stores ciphertext `secret` `iv12+ct` only, not plaintext; `localStorage` `5MB` insufficient for `100` `HGETALL` cache — use `idb-keyval`.

## 11) Implementation Phases (on beta)

1. **Phase 1 — Redis shell:** Remove Drizzle/Nuxthub, add `server/utils/redis.ts` `@upstash/redis`, create `auth:setup` + `auth:status` + `accounts:meta` `Hash`, wire `/setup` page (generate `DEK` + `auth:dek:password`), update middleware and `README` `UPSTASH_*`. Test `Upstash` free DB + `docker redis`.
2. **Phase 2 — Client encryption + cache:** Convert `accounts` routes to `HGETALL`/`HSET`/`HDEL` + `multi-exec` `version` bump, add `useEncryptionKey` (`DEK` memory) + `app/utils/cache.ts` `GET /api/accounts/meta` version check before `GET /api/accounts`, migrate Add/Edit/Tile, `accounts:order` separate key. Test empty + reload unwrap + focus sync.
3. **Phase 3 — PRF wrapping:** Add `prfSalt`, `auth:dek:prf:*`, updated webauthn routes, IndexedDB wrapped cache, passkey login unwrap flow (fetch wrapper from Redis). Test same-device and cross-device (two browsers, synced passkey).
4. **Phase 4 — Change-password, wipe & polish:** `change-password` (re-wrap `DEK`), explicit `wipe` `SCAN auth:dek:prf:*`, backup/restore QA (independent password), remove old env checks, write deploy docs for `UPSTASH_*`/`REDIS_URL` + `version` sync.

## 12) Testing Checklist

- `pnpm dev` with empty Redis (`UPSTASH_REDIS_REST_URL` set) -> shows `/setup` -> sets password (DEK generated, `auth:dek:password` stored, `accounts:meta version 0`) -> `/` shows empty state cached `version 0`.
- Login with password -> fetch `auth:dek:password` -> unwrap `DEK` -> `GET /api/accounts/meta` `version 0` matches cache -> `HGETALL accounts` `1` cmd -> decrypt -> add account (`HSET` + `HINCRBY version 1` `multi-exec`) -> reload other tab `meta` `version 1` > cache -> `HGETALL` syncs.
- Wrong password -> 401, memory cleared, wrapped cache untouched.
- Passkey register with PRF while unlocked -> `auth:dek:prf:{id}` exists in Redis -> logout -> passkey login without typing password (fetch wrapper from Redis, unwrap with PRF) -> `meta` check -> `HGETALL` decrypt.
- Cross-device: incognito/new browser, passkey login (synced credential) -> fetch wrapper from server -> `HGETALL` success (wrapped-only cache not required).
- PRF unsupported browser -> passkey registers but no `auth:dek:prf:*` -> login requires password modal via `auth:dek:password`.
- Batch reorder 5 items: `PATCH /api/accounts/order` `SET accounts:order` + `HINCRBY version 1` `1` HTTP `2` cmds billed vs `5` `HSET` — `HGETALL` unchanged, `order` updated, other device `meta` poll syncs.
- Cache: `GET /api/accounts` not called when `cached.version === server.version` (check Network tab). `500K` free quota safe: `focus` `1` `HGET accounts:meta` not `HGETALL`.
- Password change while unlocked -> `auth:dek:password` rotated, old `auth:dek:prf:*` still valid, no `HGETALL` re-encryption.
- Independent backup: export encrypted file with backup password -> restore on fresh instance `HSET` per field `multi-exec`.
- Self-host: `REDIS_URL=redis://localhost:6379` `ioredis` same `HGETALL`/`HSET`.
- Logout clears `useState('dek')` -> `HGETALL` returns ciphertext but client shows locked state; `IndexedDB` still only wrapped entries + ciphertext cache.

## 13) Open Decisions (record before coding)

- Hash lib: `argon2` (needs Node 20+) vs `bcryptjs` (pure JS, edge-safe). Choose `bcryptjs` for `Upstash REST` edge or `argon2` via WASM?
- Password regex: keep `shared/types/index.ts:28` strict rule or relax to `min 8` per your `will decide`?
- Passkey UX on new device with no wrapper yet: require password once to create new wrapper or block passkey until re-register? Current: passkey login with wrapper required; if none, fallback to password then auto-create new `auth:dek:prf:*`.
- `NUXT_SESSION_PASSWORD` generation: keep env vs generate random per deploy and persist in Redis?
- Cache invalidation: poll `30s` + `focus` vs `Redis` `Pub/Sub`? Chose poll `meta` `1` cmd for `500K` efficiency.

## 14) References

- `findings.md:1` for Nuxt 4/Ui 4/Zod 4 breaking changes to apply after this overhaul (keep on beta).
- Official docs used via `agent-browser`: `upstash.com/docs/redis/features/restapi` (`MGET`, `HGETALL`, `Transactions` `multi-exec`, `REST API Pros`), `upstash.com/pricing` (`Free 500K cmds 256MB`), `unstorage` `Hash`/`upstash` drivers, `simplewebauthn.dev/docs`, `vueuse.org`, `nodejs.org/en/blog/release/v24`.

---

## 15) Offline-First PWA + Redis Command Reduction (plan, pending implementation)

> Update 2026-08-30 (after the Redis overhaul landed on beta). Scope per user decisions: **full offline unlock + read-only** (NO server-call queueing — writes show a friendly offline error), **icons left as-is** (remote, revisit later), **all four Redis optimizations**.

### 15.1 Current gaps (verified in code)

**Offline blockers**
| Area | Problem |
|------|---------|
| Login/unlock | Password login requires `POST /api/auth/login`; passkey requires `/api/webauthn/wrap`. Both fail offline. Wrapped DEK is already cached in IndexedDB (`wrappedDEK:password`, `wrappedDEK:prf:{id}`) but never used for local unlock. |
| Vault load | `index.vue` calls `/api/accounts/meta` + `/api/accounts` + `/api/accounts/order` — all fail offline; no fallback to the IndexedDB ciphertext cache. |
| Auth guard | `middleware/auth.ts` does a blocking `$fetch("/api/auth/status")` that fails offline. |
| Writes | `Form`/`Edit`/`Tile` delete/`Qrscan`/backup-restore throw on network error — silent data-loss UX. |
| Icons | `icon.serverBundle:'remote'` → remote CDN (deferred per decision). |

**Redis command waste**
1. Every write endpoint re-reads `getAccountsMeta()` (extra `HGETALL accounts:meta`) just to return `version`, even though the pipeline's `HINCRBY` already returns it.
2. Cold load = 3 requests (`meta`, `accounts`, `order`); `order` could ride along with `meta`.
3. `delete` does a redundant `HGET` existence check before `HDEL` (HDEL returns affected count).
4. `/setup` and any wipe run sequential `SET`/`HSET`/`DEL` instead of one transaction.

### 15.2 Part A — Full offline unlock + read-only

- **A1 offline unlock via cached wrapped DEK** (`login.vue`, `useEncryption.ts`): read cached `wrappedDEK:password` / `wrappedDEK:prf:{id}` from IndexedDB and unwrap locally (`decryptWithPassword` / `decryptWithKey` + local PRF). Try network first, fall back to local on failure. Zero-knowledge preserved (only wrapped DEK cached).
- **A2 cache-first vault load** (`index.vue`): render from IndexedDB ciphertext cache immediately; online → reconcile with server `meta` version; offline → decrypt cache with in-memory DEK, set `isOffline` flag.
- **A3 offline-aware route guard** (`middleware/auth.ts`): stop hard-blocking on `$fetch("/api/auth/status")`; use cached `setupComplete` + session presence; allow `/` offline with unlocked cached vault.
- **A4 writes → friendly offline error** (`app/utils/offline.ts` + write components): guard each write with an offline check → clear "You're offline — can't save right now" toast instead of a raw network error. Read-only offline.
- **A5 service-worker app-shell** (`nuxt.config.ts`): keep existing precache + `navigateFallback`; do not add runtime caching for `/api/accounts/meta` or `/api/accounts` (IndexedDB provides partitioned local vault caching without exposing account data across sessions). Preserve icon configuration.

### 15.3 Part B — Lower Redis commands (all four)

- **B1 return version from `HINCRBY` result** (`post/patch/delete/order`): capture the new version from the pipeline `HINCRBY` return instead of `getAccountsMeta()`. Saves 1 cmd/write. Ensure `multiExec` returns per-command results reliably for both Upstash (pipeline) and ioredis.
- **B2 fold `order` into `/api/accounts/meta`** (`meta.get.ts`, `index.vue`, `cache.ts`): meta → `{version, updatedAt, count, order}`; cold load = 2 requests; warm/offline reads `cache.order` locally.
- **B3 drop redundant delete existence check** (`index.delete.ts`): `HDEL` returns count; remove the separate `HGET`. Keep `HGET` in `patch` (real read-modify-write).
- **B4 batch setup/wipe into one transaction** (`setup.post.ts`, `redis.ts`): combine sequential writes into one `multiExec` (atomic, fewer billed cmds); keep `setupComplete` guard read for 409.

### 15.4 Files

- **New**: `app/utils/offline.ts`.
- **Client modify**: `app/composables/useEncryption.ts`, `app/pages/login.vue`, `app/pages/index.vue`, `app/middleware/auth.ts`, `app/utils/cache.ts`, `app/components/Form.vue`, `Edit.vue`, `Tile.vue`, `Qrscan.vue`, `BackupAndRestore.vue`, `ChangePassword.vue`.
- **Server modify**: `server/api/accounts/index.post.ts`, `index.patch.ts`, `index.delete.ts`, `order.patch.ts`, `meta.get.ts`, `server/api/auth/setup.post.ts`, `server/utils/redis.ts`.
- **Config**: `nuxt.config.ts` (Workbox `runtimeCaching` only).

### 15.5 Verification

- `pnpm dev` → setup → add accounts → reload online (works).
- Go offline → vault unlocks from cached wrapped DEK → codes render + copy → add/edit/delete show offline toast.
- Reconnect → data reconciles via version.
- Network tab: cold load = 2 requests; warm load = 0; each write = 1 pipeline with no extra meta re-read.
- Confirm `500K` Redis quota usage drops.

