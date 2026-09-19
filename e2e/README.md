# End-to-end (live browser) testing

These checks drive a **real Chrome** against the running app using
[`agent-browser`](https://www.npmjs.com/package/agent-browser) (Chrome DevTools
Protocol based). They complement the hermetic unit tests in `../tests/` and are
run manually (not in CI) because they need a live server and a live Redis.

## Prerequisites

```bash
# one-time
npm i -g agent-browser && agent-browser install

# start the app against the configured Upstash test Redis
pnpm dev            # serves on http://localhost:9696
```

## Automated smoke run

```bash
./e2e/smoke.sh                       # uses http://localhost:9696
BASE_URL=http://localhost:9696 PASSWORD=Abcdef1! ./e2e/smoke.sh
```

`smoke.sh` logs in, confirms the dashboard, verifies TOTP codes render and
refresh across a 30-second window, and saves a screenshot.

## Passkey (WebAuthn) testing

Passkeys need a **virtual authenticator** because CI/headless machines have no
real security key. Chrome exposes one over CDP:

```
WebAuthn.enable
WebAuthn.addVirtualAuthenticator { protocol: ctap2, transport: internal,
  hasResidentKey: true, hasUserVerification: true, isUserVerified: true,
  automaticPresenceSimulation: true }
```

`agent-browser` does not (yet) wrap these commands, so they must be issued on the
page's CDP session directly. A minimal driver is included at
`e2e/webauthn-virtual-authenticator.mjs`.

### Known limitation: PRF extensions

This app wraps its vault DEK with the WebAuthn **PRF extension**, so a passkey
login is only useful when the authenticator returns PRF output. Chrome's CDP
virtual authenticator **does not implement the `prf` extension**, so driving a
full passkey *login* to completion is not possible in this harness — the
`navigator.credentials.get()` promise never resolves once `extensions.prf` is
requested.

What *is* verifiable with the virtual authenticator:

- **Passkey registration** — `generateRegistrationOptions` +
  `verifyRegistrationResponse` complete (HTTP 200), the credential is stored, and
  it appears in Settings → Passkeys.
- **Passkey authentication options** — `generateAuthenticationOptions` returns a
  well-formed challenge (`POST /api/webauthn/authenticate` with `verify:false`).

To test an end-to-end passkey login, use a real platform authenticator
(Touch ID / Windows Hello) or a software authenticator with PRF support; then
run the manual steps below.

### Manual passkey checklist (real authenticator)

1. Settings → Passkeys → Add → register (e.g. "My device").
2. Lock & Sign Out.
3. Click **Login with Passkey** → complete the OS prompt.
4. Confirm the vault unlocks and accounts decrypt (DEK unwrapped via PRF).
5. Settings → Passkeys → delete the passkey; confirm it disappears.

## Verified live flows (dependency-upgrade validation run)

The following were exercised against a real dev server on the upgraded
dependency set and passed:

| Flow | What it validates |
| --- | --- |
| First-run setup / login | bcryptjs 3 hashing + verify (`$2b$12$` hashes) |
| Add TOTP via setup key | otpauth 9 + zod 4 `accountSchema` validation |
| Live TOTP generation + 30s refresh | otpauth 9 code generation |
| Google migration import (QR upload) | protobufjs 8 decode of `otpauth-migration://` |
| Search | filtering across stored accounts |
| Encrypted backup export + restore | WebCrypto + backup schema round-trip |
| Change password + re-login | bcryptjs 3 hash/verify across a password change |
| PWA service worker | `@vite-pwa/nuxt` + workbox precache active |
| Passkey registration | SimpleWebAuthn 14 register ceremony (200, stored) |

### Harness limitation deliberately excluded

- **Passkey login with the CDP virtual authenticator** — blocked by the missing
  PRF extension described above (not an application or dependency defect; see
  that section).
