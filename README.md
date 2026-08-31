<div align="center">
<img src="./public/logo.png" width="300px" alt="logo" />
</div>
<h1 align="center">MyAuthenticator</h1>
<p align="center">A serverless progressive web application that generates TOTP and HOTP codes, offering robust two-factor authentication (2FA) directly within your browser.</p>

<div align="center">
  
[![Nuxt 4 Badge](https://img.shields.io/badge/Nuxt_4-black?style=for-the-badge&logo=nuxt&link=https%3A%2F%2Fnuxt.com)](https://nuxt.com)
[![NuxtHub Badge](https://img.shields.io/badge/NuxtHub-black?style=for-the-badge&logo=nuxt&link=https%3A%2F%2Fnuxt.com)](https://hub.nuxt.com)
[![NuxtUi Badge](https://img.shields.io/badge/Nuxtui_3-black?style=for-the-badge&logo=nuxt&link=https%3A%2F%2Fnuxt.com)](https://ui.nuxt.com)
[![Cloudflare Pages Badge](https://img.shields.io/badge/Cloudflare_Pages-black?style=for-the-badge&logo=cloudflarepages&link=https%3A%2F%2Fpages.cloudflare.com)](https://pages.cloudflare.com)
[![Typescript Badge](https://img.shields.io/badge/Typescript-black?style=for-the-badge&logo=typescript&link=https%3A%2F%2Fwww.typescriptlang.org)](https://www.typescriptlang.org)
[![Drizzle Badge](https://img.shields.io/badge/Drizzle-black?style=for-the-badge&logo=drizzle&link=https%3A%2F%2Fdrizzle.com)](https://drizzle.com)
[![Tailwindcss Badge](https://img.shields.io/badge/Tailwindcss_4-black?style=for-the-badge&logo=tailwindcss&link=https%3A%2F%2Ftailwindcss.com)](https://tailwindcss.com)

</div>

## Live Demo

[![Demo Site](https://img.shields.io/badge/Demo-Visit-blue?style=for-the-badge&logo=googlechrome)](https://my-authenticator.pages.dev)

- Credentials: `admin` - `Admin@123$`

## Deploy 🚀

[![Deploy to NuxtHub](https://hub.nuxt.com/button.svg)](https://hub.nuxt.com/new?repo=IAMSDR/MyAuthenticator)

> [!NOTE]
> This project is currently under testing and improvements. Please back up your data before proceeding.

You can deploy this project on your Cloudflare account for **free** with zero configuration using **[NuxtHub](https://hub.nuxt.com)**. You can use either the NuxtHub CLI or the NuxtHub Admin Web UI. Simply select your GitHub account, set the required environment variables, and you're done. You now have your own authenticator.

## Features 🔥

**🚀 Serverless:** Fully leverages edge support, eliminating the need for server maintenance. Deploy on Cloudflare Pages for _free_.

**⚙️ Compatibility:** Supports `TOTP` (Time-Based One-Time Password) and `HOTP` (HMAC-Based One-Time Password), widely used for two-factor authentication.

**☀️ Theming:** Built with Nuxt UI v3, offering light and dark themes with customizable accent colors and more.

**💫 Icons:** Fetches icons directly from [Iconify](https://iconify.design/), providing a vast collection from various icon sets.

**🔐 Secure:** Utilizes `nuxt-auth-utils` for authentication, supports passkeys for secure access, and encrypts database fields for enhanced security.

**🗃️ Backup / Restore:** Securely backup and restore authenticators with encryption seamlessly.

## Screenshots 📱

<p>
  <img src='./public/screenshots/1.jpg' height="690"/>
  <img src='./public/screenshots/2.jpg' height="690"/>
  <img src='./public/screenshots/3.jpg' height="690"/>
  <img src='./public/screenshots/4.jpg' height="690"/>
  <img src='./public/screenshots/5.jpg' height="690"/>
  <img src='./public/screenshots/6.jpg' height="690"/>
</p>

## Environment Variables

```sh
# required
NUXT_SESSION_PASSWORD="your-32-char-super-long-secret-for-session-encryption"

# Redis – choose one
UPSTASH_REDIS_REST_URL="https://your-upstash-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
# or self-host
REDIS_URL="redis://localhost:6379"
# Vercel alias also accepted
KV_REST_API_URL="https://your-upstash-url.upstash.io"
KV_REST_API_TOKEN="your-upstash-token"
```

### Required Variables

- `NUXT_SESSION_PASSWORD`: Used by `nuxt-auth-utils` to sign session cookie. Must be at least 32 characters long. Keep it in env only (not stored in Redis).

- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` **or** `REDIS_URL`: Redis connection. Upstash REST works on Cloudflare Workers/edge/Vercel (HTTP), `ioredis` via `REDIS_URL` works for Docker/self-host TCP. Set one pair. Free Upstash tier: 500K commands / 256 MB.

### Security Notes (envelope encryption)

- Vault is **client-side zero-knowledge-ish**: a random 256-bit `DEK` is generated on `/setup` via `crypto.getRandomValues(32)`. `DEK` encrypts all `secret` fields (`AES-GCM iv12+ct` via `shared/utils/aes.ts:80`). Password and passkey PRF are `KEK`s that only wrap `DEK` (`auth:dek:password`, `auth:dek:prf:{id}` in Redis, `AES-GCM` ciphertexts).
- Server never sees `DEK` or `prfSecret`. `auth:passwordHash` (`bcryptjs` cost 12) is for verification only.
- `DEK` lives only in memory (`useState('dek')`), cleared on logout/`beforeunload`. `IndexedDB` holds only wrapped DEK + ciphertext cache, never raw `DEK`.
- If password + all passkey PRF wrappers are lost, `DEK` is unrecoverable → data loss (no wipe/reset endpoint). Change password only when unlocked (re-wraps `DEK`). No recovery.
- Passkey without `auth:dek:prf:*` wrapper is auth-only and will show “Passkey has no decrypt wrapper, use password login” (blocked per policy).
- Backup/restore uses independent backup password (`BackupAndRestore.vue` `encryptWithPassword`), not `DEK`; restore re-encrypts plaintext secrets with live `DEK` before `HSET`.

## Contributing and Suggestions

Feel free to contribute to this project with your ideas and improvements. Your feedback and suggestions are highly valued and will help enhance this project further.

## License

MyAuthenticator is Free Software: You can use, study, share, and improve it at your will. Specifically, you can redistribute and/or modify it under the terms of the [GNU Affero General Public License](https://www.gnu.org/licenses/agpl-3.0.en.html) as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
