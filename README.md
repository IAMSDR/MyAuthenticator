<div align="center">
<img src="./public/logo.png" width="280px" alt="MyAuthenticator Logo" />
</div>

<h1 align="center">MyAuthenticator</h1>

<p align="center">A fast, private 2FA authenticator that runs in your browser and works offline. Generates TOTP and HOTP codes with client-side encryption.</p>

<div align="center">

[![Nuxt 4](https://img.shields.io/badge/Nuxt_4-00DC82?style=for-the-badge&logo=nuxt&logoColor=white)](https://nuxt.com)
[![Nuxt UI](https://img.shields.io/badge/Nuxt_UI-00DC82?style=for-the-badge&logo=nuxt&logoColor=white)](https://ui.nuxt.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Upstash Redis](https://img.shields.io/badge/Upstash_Redis-00E9A3?style=for-the-badge&logo=redis&logoColor=white)](https://upstash.com)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![Offline Ready](https://img.shields.io/badge/Offline-Ready-blueviolet?style=for-the-badge&logo=pwa&logoColor=white)](https://nuxt.com)

</div>

---

## Live Demo 🌐

[![Demo Site](https://img.shields.io/badge/Demo-Visit_Demo-blue?style=for-the-badge&logo=googlechrome&logoColor=white)](https://my-authenticator.pages.dev)

- Demo Password: `Admin@123$`

---

## Quick Deploy 🚀

You can deploy your own instance in a couple of minutes for free.

### Cloudflare Workers

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/IAMSDR/MyAuthenticator)

1. Click the button above.
2. Enter your environment variables (`NUXT_SESSION_PASSWORD`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).
3. Click deploy.

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FIAMSDR%2FMyAuthenticator&env=NUXT_SESSION_PASSWORD,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN&envDescription=Required%20session%20secret%20and%20Upstash%20Redis%20credentials&envLink=https%3A%2F%2Fgithub.com%2FIAMSDR%2FMyAuthenticator%23environment-variables&project-name=myauthenticator&repository-name=myauthenticator)

1. Click the button above and pick your GitHub account.
2. Fill in the required environment variables.
3. Click deploy.

---

## Features 🔥

- **⚡ Offline Support:** Works without internet. Once unlocked, all your codes continue to generate locally on your device.
- **🔐 Client-Side Encryption:** Accounts are encrypted right in your browser with AES-GCM. The server only stores encrypted data and never sees your raw secrets.
- **🔑 Passkeys (WebAuthn):** Sign in quickly using Face ID, Touch ID, Windows Hello, or hardware security keys.
- **⚙️ TOTP & HOTP:** Full support for standard time-based and counter-based codes (custom digits, intervals, and SHA algorithms).
- **☀️ Themes & Styling:** Clean dark and light modes with custom colors and fonts.
- **💫 Service Icons:** Automatically pulls brand logos for popular websites and services.
- **🗃️ Backup & Restore:** Export encrypted backups protected by a separate password, or export/import plain URI lists.
- **📷 QR Scanner:** Scan QR codes directly with your camera, upload an image, or type secrets manually.
- **🚀 Serverless:** Runs on Cloudflare Workers, Vercel, or self-hosted Docker with minimal setup.

---

## Screenshots 📱

<p align="center">
  <img src="./public/screenshots/1.jpg" width="31%" alt="Unlock Vault Screen" />
  <img src="./public/screenshots/2.jpg" width="31%" alt="Authenticator Dashboard" />
  <img src="./public/screenshots/3.jpg" width="31%" alt="Add Authenticator" />
</p>
<p align="center">
  <img src="./public/screenshots/4.jpg" width="31%" alt="Settings & Menu" />
  <img src="./public/screenshots/5.jpg" width="31%" alt="Theme Customizer" />
  <img src="./public/screenshots/6.jpg" width="31%" alt="Backup & Restore" />
</p>

---

## Environment Variables

Copy `.env.example` to `.env` and set your values:

```sh
# Required: 32+ character random string to sign session cookies
NUXT_SESSION_PASSWORD="your-32-char-super-long-secret-for-session-encryption"

# Redis: Option A (Recommended for Cloudflare Workers / Vercel)
UPSTASH_REDIS_REST_URL="https://your-upstash-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# Redis: Option B (Self-hosted Redis)
# REDIS_URL="redis://localhost:6379"

# Dev server port (optional)
PORT=9696
```

- `NUXT_SESSION_PASSWORD`: Used to sign session cookies. Needs to be at least 32 characters long. Generate one with:
  ```sh
  openssl rand -hex 32
  ```
- `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`: Upstash REST API credentials. Uses HTTP requests, so it works anywhere without TCP connection issues. Free tier gives you 500k requests/day.
- `REDIS_URL`: Standard Redis connection string for self-hosted setups with Node.js or Docker.

---

## How Security Works

- When you first set up the app, a random 256-bit encryption key (DEK) is created in your browser.
- Your password and passkeys wrap (encrypt) this key.
- The server only checks your password hash for login and stores the encrypted vault. It never knows your unencrypted secrets or the DEK.
- The decryption key lives only in browser memory and is cleared when you lock the vault, sign out, or close the page.
- Backups use their own separate password, so your export stays safe even if shared.

---

## Local Development

```sh
# 1. Clone the repo
git clone https://github.com/IAMSDR/MyAuthenticator.git
cd MyAuthenticator

# 2. Install dependencies
pnpm install

# 3. Setup environment
cp .env.example .env
# Fill in NUXT_SESSION_PASSWORD and your Upstash / Redis details

# 4. Run the dev server
pnpm dev
```

Open `http://localhost:9696` to view it.

To build:
```sh
# Node build
pnpm build

# Cloudflare Workers build
pnpm build:cloudflare
```

---

## Contributing

Feel free to open an issue or submit a pull request if you have ideas or bug fixes.

---

## License

[GNU Affero General Public License v3.0 (AGPL-3.0)](https://www.gnu.org/licenses/agpl-3.0.en.html)
