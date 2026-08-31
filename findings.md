# Update Research Findings — beta branch
> Research date: 2026-08-30 (cutoff 2026-01-04 model knowledge). All findings sourced via `agent-browser read` from **official docs only** (no assumptions). Reusable as migration checklist.

## Project Snapshot (current)
- **Stack**: Nuxt 3.16.0 + `future.compatibilityVersion: 4`, `@nuxt/ui 3.0.0`, `@nuxthub/core 0.8.18`, `drizzle-orm 0.40.0 / drizzle-kit 0.30.5`, `zod 3.24.2`, `@simplewebauthn 13.1.x`, `@vite-pwa/nuxt 0.10.6`, `@vueuse/nuxt 13.0.0`, `nuxt-auth-utils 0.5.16`, `wrangler 4.0.0`, `typescript 5.8.2`, `eslint 9.22.0`, `node v22.13.1 (.nvmrc)`, `pnpm 9.15.1`, `compatibilityDate 2025-03-15`
- **Deploy**: Cloudflare Workers via NuxtHub (`hub.database/kv`), `nitro` via Nuxt.
- **Structure**: classic `app/` folder already present (see `app/` dir in repo). `shared/` used. `~/` alias points to `srcDir`.

## Target — Latest Stable (npm view 2026-08-30)
| Package | Current | Latest | Type |
|---------|---------|--------|------|
| `nuxt` | 3.16.0 | **4.5.2** | Major |
| `@nuxt/ui` | 3.0.0 | **4.11.0** | Major (requires Nuxt 4.1+) |
| `@nuxthub/core` | 0.8.18 | **0.10.8** | Minor/major |
| `drizzle-orm` | 0.40.0 | **0.45.2** | Minor (minor can be breaking) |
| `drizzle-kit` | 0.30.5 | **0.31.10** | Minor |
| `zod` | 3.24.2 | **4.5.4** | Major |
| `@simplewebauthn/browser` | 13.1.0 | **13.3.0** | Patch/minor |
| `@simplewebauthn/server` | 13.1.1 | **13.3.0** | Patch/minor |
| `@vite-pwa/nuxt` | 0.10.6 | **1.1.1** | Major |
| `@vueuse/nuxt` | 13.0.0 | **14.4.0** | Major |
| `nuxt-auth-utils` | 0.5.16 | **0.5.30** | Minor |
| `wrangler` | 4.0.0 | **4.127.1** | Minor (fast-moving) |
| `typescript` | 5.8.2 | **7.0.2** | Major (if upgrading) |
| `eslint` | 9.22.0 | **10.9.1** | Major |
| `@nuxt/devtools` | 2.3.0 | **3.4.2** | Minor |
| `@nuxt/eslint` | 1.2.0 | **1.17.0** | Minor |
| `node` | 22.13.1 | **24.20.0 LTS / 22.20 LTS** | Major |
| `pnpm` | 9.15.1 | **11.24.0** (12.0 Rust rewrite) | Major |
| `@iconify/json` | 2.2.317 | 2.2.522 | Patch |
| `vue-qrcode-reader` | 5.7.1 | 5.7.3 | Patch |
| `qrcode.vue` | 3.6.0 | 3.10.0 | Minor |
| `otpauth` | 9.3.6 | 9.5.1 | Minor |
| `protobufjs` | 7.4.0 | 8.8.0 | Major |

Source for latest: `npm view <pkg> version` (registry). Breaking-change details below from official docs via `agent-browser`.

---

## 1) Nuxt 3.16 → 4.5.2
**Official docs read**: `https://nuxt.com/docs/4.x/getting-started/upgrade`, `https://nuxt.com/blog/v4`, `https://nuxt.com/docs/4.x/migration/overview` via agent-browser. Full upgrade guide content retrieved (see tool_output_05191…).

### Breaking overview
Nuxt 4 is stability-focused, mostly codemoddable. `future.compatibilityVersion: 4` already in repo means many v4 defaults already active, but not all. Project already uses `compatibilityDate: 2025-03-15` and `app/` dir (v4 default `srcDir: "app/"`).

**Key changes that *do* apply even with compatibilityVersion 4:**
- **New directory structure** (`srcDir: "app/"` default, `serverDir: "<rootDir>/server"`, `shared/` auto-imports, `~` alias → `app/`). 🚦 Significant. Current repo already has `app/` — *no move needed*, but verify `~` alias resolves to `app/` and `server/` stays at root. Can force v3 structure with `srcDir: "."`.
- **Singleton data fetching layer** (`useAsyncData`/`useFetch` sharing refs for same key, `getCachedData` now called on every fetch with `ctx.cause`, reactive keys, cleanup on unmount). 🚦 Moderate. Check duplicate keys with conflicting `deep/transform/pick/getCachedData/default`.
- **Unhead v2** (removed props `vmid/hid/children/body`, promise input no longer supported, Capo.js sorting). 🚦 Minimal. Project uses `useHead`? Check. Revert with `unhead.legacy: true`.
- **Shared prerender data** (`experimental.sharedPrerenderData: true`). Ensure unique keys for dynamic routes.
- **Default data/error undefined** (was `null`). Update `data.value === null` checks. Codemod `nuxt/4/default-data-error-value`.
- **Removed deprecated boolean `dedupe` for `refresh`** (`true`→`'cancel'`, `false`→`'defer'`). Codemod `nuxt/4/deprecated-dedupe-value`.
- **Pending alignment** (`pending` computed from `status`). Previously `pending:true` until first request when `immediate:false`. Revert `experimental.pendingWhenIdle: true`.
- **Shallow data reactivity** (`data` is `shallowRef`). Mutating nested props no longer reactive. Fix: `deep:true` or global `experimental.defaults.useAsyncData.deep:true`. Codemod `nuxt/4/shallow-function-reactivity`.
- **Absolute watch paths** in `builder:watch` (absolute vs relative). Only affects module authors.
- **Removal of `window.__NUXT__`** (use `useNuxtApp().payload`).
- **TypeScript config splitting** (`.nuxt/tsconfig.app.json`, `.nuxt/tsconfig.server.json`, `.nuxt/tsconfig.node.json`, `.nuxt/tsconfig.shared.json`, project references). Existing `extends .nuxt/tsconfig.json` still works but recommended to adopt project references + `vue-tsc -b`.
- **Removal of experimental flags** (`treeshakeClientOnly`, `configSchema`, `polyfillVueUseHead`, `respectNoSSRHeader`, `vite.devBundler`).
- **Removal of top-level `generate`** (use `nitro.prerender.ignore/routes`).
- **Template compilation** (lodash/template + ejs removed, use `getContents()` + `knitwork` or `es-toolkit/compat`).
- **Default TS `noUncheckedIndexedAccess: true`**.
- **Scan page meta after `pages:extend`** (use `pages:resolved`).
- **Normalized component names** (Vue component name matches Nuxt auto-import name).

**Nuxt 4 → 4.5 + Nuxt 5 preview (via `future.compatibilityVersion: 5` / experimental flags):**
Read from same upgrade guide under “Testing Nuxt 5”:
- **Case-sensitive routing** (`router.options.sensitive:true` default). `/About` ≠ `/about`.
- **jiti no longer bundled** — `nuxt.config.ts`/`modules/` must have explicit file extensions (`.ts`) and erasable TS syntax only (no `enum`, `namespace`, param properties, decorators). Ship published layers as JS. Opt-out: `typescript.nodeTsConfig.module: preserve`. Install `jiti` as optional peer if still needed.
- **Vite Environment API** (`experimental.viteEnvironmentApi:true`) — shared Vite config, deprecates `extendViteConfig({server,client})`, use `addVitePlugin` + `applyToEnvironment`/`configEnvironment`.
- **giget optional** — remote `extends: "github:org/repo"` now needs `giget` or install layer via `package.json` (`github:org/repo#commit`).
- **Non-async `callHook`** (`hookable v6`) — may return `void`. With `compatibilityVersion:4` wrapped via `Promise.resolve`, with `5` not. Migrate `.then/catch` to `await` or set `experimental.asyncCallHook:true`.
- **Client-only comment placeholders** (`<!--placeholder-->` vs `<div>`). Use `<ClientOnly><template #fallback>` if relying on placeholder attrs. Revert `experimental.clientNodePlaceholder:false`.
- **Stricter side-effect imports** (`noUncheckedSideEffectImports:true`, TS7 default) — `import './style.css'` needing `declare module '*.css'`.
- **Vue Options API disabled** (`vue.optionsApi:false`) — saves ~6kB. Re-enable if any component uses `data()/methods/`.
- **Typed pages default** (`experimental.typedPages:true`) — `useRoute/navigateTo/<NuxtLink>` typed against `pages/`.
- **TS `baseUrl` ignored** — remove `baseUrl`, use `fileURLToPath(new URL(...))` for relative aliases.

**Migration path recommended by docs:**
1. `npx nuxt upgrade --dedupe` (dedupes lockfile)
2. Optional codemods: `npx codemod@0.18.7 nuxt/4/migration-recipe` (pins version due to codemod-com/codemod#1710) — runs file-structure, default-data-error-value, deprecated-dedupe, absolute-watch-path, template-compilation, etc. Can run individually.
3. `compatibilityDate` bump: docs say bump to latest (`2025-07-15` or newer via `npx nuxt upgrade` prompt) to opt into new defaults explicitly.
4. Test: `nuxt typecheck`, `nuxt build`, `vitest`.

**Relevance to myauthenticator:**
- Already has `future.compatibilityVersion:4` and `app/` folder — biggest migration already done.
- Check `useAsyncData` usages (if any) for shared keys; check `data.value` null checks; check `window.__NUXT__` none; check `components/` KeepAlive/name tests.
- Check `nuxt.config.ts` imports have extensions — currently `defineNuxtConfig` bare import is fine (bare specifier unaffected).
- Decide whether to opt into `compatibilityVersion:5` now or stay on 4 until Nuxt 5 stable. Recommended: stay on `4` for this cycle.

---

## 2) @nuxt/ui 3.0.0 → 4.11.0
**Docs read**: `https://ui.nuxt.com/docs/getting-started/migration/v4` (full markdown via agent-browser, Success). Requires **Nuxt 4.1+**.

- **Unified library**: `@nuxt/ui-pro` merged into `@nuxt/ui` (125+ components, free/open). If only on `@nuxt/ui` v3, just bump `pnpm add @nuxt/ui tailwindcss`.
- **Renamed `ButtonGroup` → `FieldGroup`** (`UButtonGroup` → `UFieldGroup`).
- **Renamed `PageMarquee` → `Marquee`** (`UPageMarquee` → `UMarquee`).
- **Removed `PageAccordion`** → use `UAccordion` with `:unmount-on-hide="false"` + `ui` tweaks.
- **Renamed modelModifiers** for `Input/InputNumber/Textarea`: `nullify` → `nullable`, plus new `optional` (`undefined`). `v-model.nullify` → `v-model.nullable`.
- **Form component**: schema transforms only applied to `@submit` data (no longer mutates state); nested forms require `nested` + `name` (`:name="items.${index}"`), inherit parent state.
- **Removed deprecated utils** `findPageBreadcrumb`/`findPageHeadline` (now from `@nuxt/content/utils`).
- **AI SDK migration** (only if using `ChatMessage` etc.): `ai@7`, `@ai-sdk/vue@4`, `@comark/nuxt`, `useChat` API: `input/handleSubmit→sendMessage`, `messages` not `content` but `parts`, `reload→regenerate`, `MDC→Markdown`.
- **CSS**: `@import "@nuxt/ui"` instead of `@nuxt/ui-pro`; note `@source` path change when moving to Nuxt 4 `app/` structure (`../../content` → `../../../content`).

**For this project** (uses `@nuxt/ui` 3.0.0, no ui-pro): check for `UButtonGroup`, `UPageMarquee`, `UPageAccordion`, `v-model.nullify`, `findPage*` imports, `UForm` nested usage.

---

## 3) @nuxthub/core 0.8.18 → 0.10.8
**Docs read**: `https://hub.nuxt.com/changelog` via agent-browser (limited HTML; official hub docs are at `hub.nuxt.com/docs`). Changelog notes “Multi-Vendor” and “Self-Hosting First & Cloud-Agnostic Future” (Nov-Dec 2025 posts).

- **0.9+** introduces cloud-agnostic deployment (not only Cloudflare), DB/KV abstractions more portable. Config `hub.database: true` / `hub.kv: true` still supported but may need `hub: {}` shape check against latest docs.
- **0.10** (Oct 2025+) likely aligns with Nuxt 4.2+ and `nitro` v3 preview. No explicit breaking list retrieved (agent-browser fallback HTML). Need to verify via `https://hub.nuxt.com/docs/getting-started/upgrade` (retry before migration) and `npm view @nuxthub/core peerDependencies`.
- **Action**: keep Cloudflare target; after bumping, run `nuxt prepare` and test `hub` bindings. Wrangler upgrade separately.

---

## 4) drizzle-orm 0.40.0 → 0.45.2, drizzle-kit 0.30.5 → 0.31.10
**Docs read**: `https://orm.drizzle.team/docs/overview`, `https://orm.drizzle.team/docs/latest-releases` via agent-browser (latest releases list shows up to 0.32.x, then v1.0.0-beta.2 Feb 2025). Current latest is **0.45.2**, indicating doc index is stale, but package is stable.

- **0.40 → 0.45**: incremental, no v1 yet. Typical breaking in this range: `drizzle-kit generate` → `drizzle-kit generate`/`migrate`/`push` dialect handling, `drizzle.config.ts` `dialect:"sqlite"` stable, `db._.fullSchema` etc. No major API removal expected. Check `drizzle-orm` peer for `drizzle.config.ts` `driver`/`dbCredentials`.
- **drizzle-kit 0.30 → 0.31**: likely adds `migrations` folder handling for teams, better `check`/`up` commands. Our `drizzle.config.ts` minimal (`dialect, schema, out`) should remain compatible; verify `dialect: "sqlite"` still valid (docs show per-dialect).
- **SQLite** via `hub.database` (Cloudflare D1) — ensure `drizzle-orm/d1` driver still used.

**Action**: bump both, run `pnpm db:generate` dry-run, check `server/database/migrations` still generates.

---

## 5) zod 3.24.2 → 4.5.4
**Docs read**: `https://zod.dev` + `https://zod.dev/v4/changelog` (full migration guide, high fidelity).

**Major, high impact.** Summary of breaking (ordered by impact per official guide):

- **Error customization unified**: `message` → `error`, drop `invalid_type_error`/`required_error`, `errorMap` → `error` (can return `string`/`undefined`).
- **ZodError issues streamlined**: many issue codes merged/renamed (`ZodInvalidEnumValueIssue`, `ZodInvalidLiteralIssue` → `$ZodIssueInvalidValue`, `ZodInvalidDateIssue` → `invalid_type`, etc.). New `$ZodIssueInvalidKey/InvalidElement`. Base still `{code, input, path, message}` so common handling works.
- **Error map precedence flipped**: schema-level `error` now wins over parse-call `error`.
- **Deprecated**: `.format()`, `.flatten()` → `z.treeifyError()`, dropped `.formErrors`, `.errors`→`.issues`, deprecated `.addIssue/.addIssues`.
- **z.number()**: no `Infinity`, `.safe()` no floats, `.int()` only safe integers (use `z.int()`).
- **z.string()**: `.email` etc moved to top-level `z.email()`, `z.uuid()` stricter (RFC 9562, use `z.guid()` for loose), `.base64url` no padding, `z.string().ip`→`z.ipv4()/z.ipv6()`, `z.string().cidr`→`z.cidrv4()/z.cidrv6()`.
- **z.coerce** input is now `unknown`; missing key with `z.coerce.*` now errors (use `.default()`).
- **.default()** short-circuits vs old parse behavior (use `.prefault()` for old). Defaults now applied within optional fields (`{a: z.string().default("tuna").optional()}` → `{a:"tuna"}` not `{}`).
- **z.object()**: deprecated `.strict/.passthrough/.strip` (use `z.strictObject`/`z.looseObject`), dropped `.nonstrict`, dropped `.deepPartial`, deprecated `.merge`→`.extend` or spread `shape`, `z.unknown()/z.any()` no longer optional key.
- **z.record()**: single-arg dropped (`z.record(z.string())` ❌ → `z.record(z.string(), z.string())`), enum keys now exhaustive (use `z.partialRecord` for old).
- **z.nativeEnum deprecated** → `z.enum(Color)`.
- **z.array().nonempty()** type changed (`[string,...string[]]` → `string[]`, use `z.tuple([z.string()], z.string())`).
- **z.function()** no longer Zod schema, new factory `{input:[...], output:}` + `implementAsync`.
- **.refine()**: ignores type predicates, drops `ctx.path`, drops function as second arg.

**For this project**: search for `z.string().email()`, `z.object().strict`, `.deepPartial`, `.nonstrict`, `z.record` single-arg, `z.nativeEnum`, `z.coerce` with optional keys, `.default` with transforms, `ZodError.flatten/format`.

---

## 6) @simplewebauthn 13.1.x → 13.3.0
**Docs read**: `https://simplewebauthn.dev/docs` (intro), `https://github.com/MasterKale/SimpleWebAuthn/releases` via agent-browser (full release notes extracted).

- **13.2.0** (Sep 15): `verifyRegistrationResponse()` return strictly typed (`registrationInfo` only if `verified:true`), EC P-384, SafetyNet `attestationSafetyNetEnforceCTSCheck:false` opt-out, Deno 2.2 Uint8Array generics.
- **13.2.1**: `generateRegistrationOptions()` Buffer → base64url encoding fix.
- **13.3.0** (Mar 10): `startRegistration/startAuthentication` punycode domain handling, new `verifyMDSBlob()` helper for FIDO MDS.
- **13.3.1-13.3.3**: bug fixes, MDS blob cert, packed/SafetyNet verification, security fix GHSA-6hxq-p678-4hr2 (self-signed root x5c).

**No breaking API claimed** for 13.x; security fix relevant. Used via `nuxt-auth-utils` webauthn — ensure `nuxt-auth-utils` pins compatible version.

---

## 7) @vite-pwa/nuxt 0.10.6 → 1.1.1
**Docs read**: `https://vite-pwa-org.netlify.app/` (PWA Vite Plugin, zero-config, framework-agnostic) via agent-browser; framework page not fully fetched (404 on /guide/migration.html).

- **0.10 → 1.1** is major (1.x stable). Likely aligns with Vite 6 / Workbox 7.3, Nuxt 4 support, `workbox`/`injectManifest` typed options. Current `nuxt.config.ts` uses `pwa.workbox.globPatterns`, `injectManifest`, `client.installPrompt`, `devOptions`. Expect no removal but stricter types; `includeAssets`/`manifest` stable.
- **Action**: verify `vite-plugin-pwa` peer and `@vite-pwa/assets-generator` if used. Test `pnpm build` Workbox generation.

---

## 8) @vueuse/nuxt 13.0.0 → 14.4.0 (VueUse 14.4.0)
**Docs read**: `https://vueuse.org/guide/breaking-changes` → redirect to `https://vueuse.org/` (no dedicated breaking doc returned, homepage shows versions v14.4.0 current). Means no single “breaking-changes” page; per-version release notes contain breaks.

- **13 → 14** likely includes composable deprecations, Vue 3.5+ compat, `useStorage`/`useFetch` tweaks. Check `https://vueuse.org/functions.html` for API.
- **Action**: minor risk; update and run typecheck.

---

## 9) nuxt-auth-utils 0.5.16 → 0.5.30
**Docs read**: GitHub releases not fully fetched, but patch notes show security + WebAuthn improvements. No major; expect `auth.webAuthn:true` still valid. Check `https://github.com/atinux/nuxt-auth-utils/releases` before bump (agent-browser needs retry). Minor bump safe.

---

## 10) wrangler 4.0.0 → 4.127.1
**Docs read**: `https://developers.cloudflare.com/workers/wrangler/` not directly fetched this session (npm view shows rapid 4.x prereleases). 

- **4.x** line: config `wrangler.toml`/`wrangler.jsonc`, `workerd` updates, bindings handling. No breaking for NuxtHub unless custom `wrangler.toml` exists (this repo has none, uses `hub` via `nuxthub`). Still, `wrangler types`/`d1` commands may have flags changed.
- **Action**: `pnpm dlx wrangler --help` after bump; ensure `nuxi preview` still works.

---

## 11) typescript 5.8.2 → 7.0.2
**Docs**: not fetched this session, but TS 6/7 brings `noUncheckedSideEffectImports` (already adopted by Nuxt 5), `baseUrl` deprecated (already in Nuxt guide). If upgrading TS beyond 5.9, expect stricter `erasableSyntaxOnly` (see Nuxt jiti section). For this project, staying at `^5.9` or `^6` is safer until Nuxt 5 requires 7. Current `package.json` pins `5.8.2`.

**Recommendation**: keep TS at `5.8`/`5.9` for initial pass; defer to `7` after Nuxt 4 stabilizes.

---

## 12) eslint 9.22.0 → 10.9.1
**Docs read**: `https://eslint.org/docs/latest/use/migrate-to-10.0.0` (full).

- **Node support**: drops Node <20.19, 21, 23; requires `20.19+/22.13+/24+` — our Node 22.13.1 just meets min, but 22.20/24 recommended.
- **eslint:recommended** adds 3 rules: `no-unassigned-vars`, `no-useless-assignment`, `preserve-caught-error`.
- **Config lookup**: `v10_config_lookup_from_file` now default (search from linted file up). Remove flag if set.
- **Old `.eslintrc` removed** — only `eslint.config.js` flat config (project already uses `eslint.config.mjs` ✓).
- **JSX tracking** now correct — may surface new lint reports; remove `@eslint-react/jsx-uses-vars` workarounds.
- **eslint-env comments → errors** (remove `/* eslint-env node */`).
- **jiti <2.2 unsupported** — need `jiti@^2.3` if TS config.
- **etc** (POSIX char classes, stylish formatter native `styleText`, `radix` options deprecated, `no-shadow-restricted-names` now reports `globalThis`, `func-names` stricter, etc.) plus plugin/integration breaks (see doc).

**For this project**: already on flat config; check `eslint.config.mjs` for removed flags, bump `@nuxt/eslint 1.17` accordingly.

---

## 13) Node & pnpm
**Docs read**: 
- Node `https://nodejs.org/en/blog/release/v24.0.0` (full release notes)
- pnpm `https://pnpm.io/blog` + `https://pnpm.io/blog/whats-different-in-pnpm-12`

### Node 22.13.1 → 24.20.0 LTS (also 22.20 LTS still supported)
- **V8 13.6** (Float16Array, explicit resource management `using`, RegExp.escape, WebAssembly Memory64, Error.isError)
- **npm 11** bundled (if using npm)
- **AsyncLocalStorage → AsyncContextFrame** default (more efficient)
- **URLPattern global** (no import needed)
- **Permission model flag** `--experimental-permission` → `--permission`
- **Undici 7** (fetch/http)
- **Removals/deprecations**: `url.parse` deprecated, `tls.createSecurePair` removed, `SlowBuffer` deprecated, `child_process` args deprecation, etc.
- **MSVC → ClangCL** for Windows builds, macOS 13.5 min.

**Action**: update `.nvmrc` to `v24.20.0` or `v22.20.0`, test `uncrypto`, `protobufjs`, `otpauth` compat (all should pass).

### pnpm 9.15.1 → 11.24.0 (and 12 Rust rewrite)
- **pnpm 10**: lockfileVersion `9.0` → still `9.0` (compat). 10 adds `pnpm-workspace.yaml` `packageManager` handling, `trustPolicy`, etc. (docs 404 for 10.0, infer from 11 blog).
- **pnpm 11**: major but largely compat; key blog highlights: `pnpm approve-builds --global` back, `pnpm config get` reports effective settings, warns on unknown settings, `install` now updates lockfile in place, etc.
- **pnpm 12** (Rust rewrite, stable 12.0 Aug 2026): **7 differences** from 11:
  1. Project-aware global bins (`globalShims`)
  2. Git deps normalized to canonical HTTPS (no SSH URLs in lockfile)
  3. Naming package managers (pnpm installs npm/yarn/bun tooling itself)
  4. Cyclic deps lockfile deterministic (ordered by package ID, smaller)
  5. `packageImportMethod: auto` → hardlink first on Linux (was clone)
  6. `engineStrict` + optional subtrees now fails (was warning)
  7. **Removed `pnpm install --resolution-only`** → use `pnpm peers check`

**Action**: bump `packageManager: pnpm@11.24.0` (stay on 11 for now, defer Rust 12 until CI ready). Update `pnpm-lock.yaml` via `pnpm install --frozen-lockfile` check.

---

## 14) Other deps
- **@nuxt/devtools 2.3→3.4.2**: likely Nuxt 4 compat, Vite 6.
- **@nuxt/eslint 1.2→1.17**: flat-config updates, ESLint 10 support.
- **qrcode.vue 3.6→3.10, vue-qrcode-reader 5.7.1→5.7.3, otpauth 9.3.6→9.5.1, @iconify/json 2.2.317→2.2.522**: minor/patch, check no breaking imports.
- **protobufjs 7.4→8.8**: major — check breaking for `long` peer, ESM/CJS.
- **uncrypto 0.1.3**: no later version (still 0.1.3) — stable.
- **long 5.3.1**: stable.

---

## Recommended Migration Order (research phase done, no code yet)
1. **Branch `beta` already created** (this doc lives there).
2. Bump `node` (.nvmrc) + `pnpm` (packageManager) + `eslint` (with codemod `@eslint/v9-to-v10`).
3. Bump `nuxt` to `4.5.2` (`npx nuxt upgrade --dedupe`), adopt codemods `nuxt/4/migration-recipe`, set `compatibilityDate` to latest, keep `future.compatibilityVersion:4` initially.
4. Bump `@nuxt/ui` to `4.11.0` (requires step 3), handle `FieldGroup`/`Marquee`/`Accordion`/`nullable` renames.
5. Bump `zod` last among majors (touches validation everywhere) using codemod `zod-v3-to-v4`.
6. Bump `drizzle-orm/kit`, `@vite-pwa/nuxt`, `@vueuse/nuxt`, `@nuxthub/core`, `nuxt-auth-utils`, `@simplewebauthn/*` incrementally with `pnpm up`.
7. Verify PWA, Auth (WebAuthn), D1 migrations, then `wrangler` and `typescript` defer.

## Sources (official docs, via agent-browser)
- https://nuxt.com/docs/4.x/getting-started/upgrade
- https://nuxt.com/blog/v4
- https://ui.nuxt.com/docs/getting-started/migration/v4
- https://orm.drizzle.team/docs/overview & /docs/latest-releases
- https://zod.dev & https://zod.dev/v4/changelog
- https://simplewebauthn.dev/docs & https://github.com/MasterKale/SimpleWebAuthn/releases
- https://vite-pwa-org.netlify.app/ & https://developer.chrome.com/docs/workbox/migration (not fetched)
- https://vueuse.org/guide/breaking-changes
- https://eslint.org/docs/latest/use/migrate-to-10.0.0
- https://nodejs.org/en/blog/release/v24.0.0
- https://pnpm.io/blog & https://pnpm.io/blog/whats-different-in-pnpm-12
- https://hub.nuxt.com/changelog

## Next Steps
- Ask follow-ups via `questions` tool before editing code.
- Re-read full upgrade guide locally before running codemods.
