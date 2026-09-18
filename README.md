<p align="center">
  <img src="./public/logo.png" width="160" alt="MyAuthenticator logo" />
</p>

<h1 align="center">MyAuthenticator</h1>

<p align="center">
  <strong>A simple 2FA authenticator you can host yourself.</strong><br />
  Keep your codes in your browser, sign in with a passkey, and use them offline.
</p>

<p align="center">
  <a href="https://nuxt.com"><img src="https://img.shields.io/badge/Nuxt_4-00DC82?style=flat-square&amp;logo=nuxt&amp;logoColor=white" alt="Built with Nuxt 4" /></a>
  <a href="#how-security-works"><img src="https://img.shields.io/badge/OTP_secrets-AES--256--GCM-0f766e?style=flat-square" alt="OTP secrets encrypted with AES-256-GCM" /></a>
  <a href="#offline-access"><img src="https://img.shields.io/badge/PWA-Offline_access-6366f1?style=flat-square" alt="Progressive web app with offline access" /></a>
</p>

<p align="center">
  <a href="https://myauthenticator.pages.dev">
    <img src="https://img.shields.io/badge/Try_Live_Demo-0284c7?style=for-the-badge&amp;logo=cloudflarepages&amp;logoColor=white" alt="Try Live Demo" />
  </a>
  &nbsp;&nbsp;
  <a href="#deploy-your-own">
    <img src="https://img.shields.io/badge/Deploy_Your_Own-16a34a?style=for-the-badge&amp;logo=rocket&amp;logoColor=white" alt="Deploy Your Own" />
  </a>
</p>

<p align="center">
  Public demo password: <code>Admin@123$</code>
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#screenshots">Screenshots</a> ·
  <a href="#deploy-your-own">Deployment</a> ·
  <a href="#self-host">Self-host</a> ·
  <a href="#local-development">Local dev</a> ·
  <a href="#how-security-works">Security</a> ·
  <a href="#troubleshooting">Troubleshooting</a>
</p>

---

## Features

- ⏱️ **TOTP and HOTP codes.** Supports time-based and counter-based codes, with settings for digits, periods, and algorithms.
- 📴 **Offline access.** Once your accounts are cached, you can unlock them and get codes without an internet connection.
- 🔐 **Browser-side encryption.** Your OTP secrets are encrypted with AES-256-GCM before they're saved to the server.
- 🔑 **Passkeys.** Sign in with your device or a security key. Passkeys with PRF support can unlock the vault too.
- 📷 **QR scanning.** Add accounts using your camera, a QR image, or a secret entered by hand.
- 💾 **Backups.** Export a password-protected backup, or move accounts using plain `otpauth://` URI lists.
- 🎨 **Themes.** Pick light or dark mode, change colors and fonts, and add service icons.
- 📱 **App installation.** Add it to your home screen or install it through a supported browser.

<sub>Built with Nuxt 4, Nuxt UI, Tailwind CSS, TypeScript, and Redis.</sub>

## Screenshots

<p align="center">
  <img src="./public/screenshots/1.jpg" width="31%" alt="MyAuthenticator vault unlock screen" />
  <img src="./public/screenshots/2.jpg" width="31%" alt="Authenticator dashboard showing account codes" />
  <img src="./public/screenshots/3.jpg" width="31%" alt="Add authenticator screen" />
</p>
<p align="center">
  <img src="./public/screenshots/4.jpg" width="31%" alt="Settings and navigation menu" />
  <img src="./public/screenshots/5.jpg" width="31%" alt="Theme customization options" />
  <img src="./public/screenshots/6.jpg" width="31%" alt="Backup and restore options" />
</p>

## Deploy your own

Deploy MyAuthenticator to the cloud or run it on your own server. Pick your preferred platform to get started.

> [!IMPORTANT]
> **Fork this repository before deploying.** Cloud deployments must be built from your own fork so you can pull in future updates.

<p align="center">
  <a href="https://github.com/IAMSDR/MyAuthenticator/fork">
    <img src="https://img.shields.io/badge/Fork_this_repo-181717?style=for-the-badge&amp;logo=github&amp;logoColor=white" alt="Fork this repository" />
  </a>
</p>

<p align="center">
  <a href="#cloudflare-workers">
    <img src="https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&amp;logo=cloudflare&amp;logoColor=white" alt="Deploy to Cloudflare Workers" />
  </a>
  &nbsp;&nbsp;
  <a href="#vercel">
    <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&amp;logo=vercel&amp;logoColor=white" alt="Deploy with Vercel" />
  </a>
  &nbsp;&nbsp;
  <a href="#self-host">
    <img src="https://img.shields.io/badge/Self--Host_(Node.js)-334155?style=for-the-badge&amp;logo=nodedotjs&amp;logoColor=white" alt="Self-Host with Node.js" />
  </a>
</p>

Each instance manages its own encrypted vault and connects to a Redis database.

You'll need:

- A GitHub account to **fork** this repository.
- An [Upstash](https://console.upstash.com/) account for Redis (or local Redis for self-hosting).
- An account for your target host: Cloudflare Workers, Vercel, or your own machine.

### 1. Prepare your credentials

You'll use the same three values with either host.

**Create a Redis database**

1. Open the [Upstash console](https://console.upstash.com/) and create a **Redis** database.
2. Open the database's **REST API** section.
3. Copy the **REST URL** and **REST token**. Choose the read/write token so the app can save your accounts.

**Generate a session secret**

Run this in a terminal and copy the output:

```sh
openssl rand -hex 32
```

<details>
<summary>Don't have OpenSSL? Use Node.js instead</summary>

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

</details>

#### Environment variables

Both hosts need the same three variables. Paste each value without quotes:

- **`NUXT_SESSION_PASSWORD`** — the random string you just generated. It must be at least 32 characters and is used to protect session cookies.
- **`UPSTASH_REDIS_REST_URL`** — the HTTPS REST URL from your database, such as `https://your-database.upstash.io`.
- **`UPSTASH_REDIS_REST_TOKEN`** — the read/write REST token from the same database.

How you enter them depends on the host:

- **Cloudflare Workers** — add them in **Settings → Variables & Secrets**.
- **Vercel** — add them in **Project Settings → Environment Variables**.

Both platform sections list the exact names to copy.

The session secret stays in your server settings. You'll choose a separate password for opening your vault when you first use the app.

### 2. Choose your host

#### Cloudflare Workers

[![Fork this repository](https://img.shields.io/badge/1._Fork_this_repo-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/IAMSDR/MyAuthenticator/fork)
[![Connect to Workers Builds](https://img.shields.io/badge/2._Connect_to_Workers_Builds-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://dash.cloudflare.com/?to=/:account/workers-and-pages)

1. **Fork this repository** using the button above. Keep it as your own fork so you can pull updates later.
2. Sign in to Cloudflare and go to **Workers & Pages**.
3. Select **Create application** → **Get started** next to **Import a repository**.
4. Under **Import a repository**, connect your GitHub account and select **your fork**.
5. Configure the project. Add the three [environment variables](#environment-variables) in **Settings → Variables & Secrets** — use these exact names:

   ```text
   NUXT_SESSION_PASSWORD
   UPSTASH_REDIS_REST_URL
   UPSTASH_REDIS_REST_TOKEN
   ```

   Paste the corresponding value for each.
6. Set the build command to `pnpm build:cloudflare` and the deploy command to `pnpm run deploy`.
7. Select **Save and Deploy**. When the build finishes, open the `workers.dev` link and [create your vault](#3-create-your-vault).

Every push to your fork — including when you [sync it with this repository](#keeping-your-deployment-updated) — triggers a new build and deploy automatically.

<details>
<summary><strong>Prefer using the command line?</strong></summary>

Follow the clone and install steps in [Local development](#local-development), then run:

```sh
pnpm exec wrangler login
pnpm run deploy
```

Wrangler builds the app using `wrangler.json`. To use a different Worker name, change `name` in that file before deploying.

Keep `run` in `pnpm run deploy`: without it, pnpm calls its own unrelated `deploy` command.

Once the Worker exists, add each secret. Paste its value when prompted:

```sh
pnpm exec wrangler secret put NUXT_SESSION_PASSWORD
pnpm exec wrangler secret put UPSTASH_REDIS_REST_URL
pnpm exec wrangler secret put UPSTASH_REDIS_REST_TOKEN
```

Once all three secrets are saved, open your Worker URL to set up the app.

</details>

#### Vercel

[![Fork this repository](https://img.shields.io/badge/1._Fork_this_repo-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/IAMSDR/MyAuthenticator/fork)
[![Import to Vercel](https://img.shields.io/badge/2._Import_to_Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/new)

1. **Fork this repository** using the button above. Keep it as your own fork so you can pull updates later.
2. In Vercel, select **Add New** → **Project** and import **your fork** from GitHub.
3. Use the repository root as the root directory and keep the detected **Nuxt** framework preset.
4. Add the three [environment variables](#environment-variables) in **Project Settings → Environment Variables**. Vercel does not pre-fill the names, so add each one — use these exact names:

   ```text
   NUXT_SESSION_PASSWORD
   UPSTASH_REDIS_REST_URL
   UPSTASH_REDIS_REST_TOKEN
   ```

   Paste the corresponding value for each. See [step 1](#1-prepare-your-credentials) if you haven't created them yet.
5. Select **Deploy**. When it finishes, open the `vercel.app` link and [create your vault](#3-create-your-vault).

Nuxt detects Vercel automatically. If you change environment variables later, redeploy to pick up the new values.

Every push to your fork — including when you [sync it with this repository](#keeping-your-deployment-updated) — triggers a new deployment automatically.

#### Keeping your deployment updated

Because your deployment builds from **your fork**, you can pull in new releases, dependency updates, and security fixes at any time:

1. Open your fork on GitHub.
2. Above the file list, select **Sync fork** → **Update branch**.
3. Cloudflare Workers Builds or Vercel detects the new commits and redeploys automatically.

#### Self-Host (Node.js)

<a id="self-host"></a>

Deploy and run MyAuthenticator as a production Node.js service on your own Linux server, VPS, or private network.

1. **Clone and install dependencies**

   ```sh
   git clone https://github.com/IAMSDR/MyAuthenticator.git
   cd MyAuthenticator
   pnpm install --frozen-lockfile
   ```

2. **Configure your environment**

   ```sh
   cp .env.example .env
   ```

   Open `.env` and fill in:
   - `NUXT_SESSION_PASSWORD` — your random 32+ character string from [step 1](#1-prepare-your-credentials).
   - Redis database: set `REDIS_URL="redis://localhost:6379"` for local Redis, or your `UPSTASH_REDIS_REST_*` credentials.
   - `PORT` — server port. Uncomment the `PORT` line in `.env` and set it to `3000` if you want to use the address below.

3. **Build for production**

   ```sh
   pnpm build
   ```

   This compiles the optimized production server to `.output/server/index.mjs`.

4. **Start the production server**

   ```sh
   node .output/server/index.mjs
   ```

   Or run a local preview that automatically loads `.env`: `pnpm preview`.

5. When the server starts, open your app's address (or reverse proxy domain) and [create your vault](#3-create-your-vault).

<details>
<summary><strong>Keep running in the background with PM2 or systemd</strong></summary>

**Using PM2**

```sh
pnpm dlx pm2 start .output/server/index.mjs --name myauthenticator
pnpm dlx pm2 save
pnpm dlx pm2 startup
```

**Using systemd**

Create `/etc/systemd/system/myauthenticator.service`:

```ini
[Unit]
Description=MyAuthenticator 2FA Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/MyAuthenticator
ExecStart=/usr/bin/node /path/to/MyAuthenticator/.output/server/index.mjs
Restart=always
EnvironmentFile=/path/to/MyAuthenticator/.env

[Install]
WantedBy=multi-user.target
```

Then reload and enable:

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now myauthenticator
```

</details>

<details>
<summary><strong>Reverse proxy &amp; HTTPS setup (Nginx / Caddy)</strong></summary>

Browsers require a secure context (HTTPS) for WebAuthn passkeys, camera QR scanning, and client-side encryption whenever you access the app outside `localhost`.

**Caddy (automatic SSL)**

```caddy
auth.yourdomain.com {
    reverse_proxy localhost:3000
}
```

**Nginx**

```nginx
server {
    server_name auth.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

</details>

### 3. Create your vault

1. Open your app's HTTPS link. On a fresh database, you'll see **Setup your account**.
2. Choose a vault password, repeat it, and follow the confirmation prompt.
3. Add your first account by scanning its 2FA QR code, uploading a QR image, or entering the secret manually.

You can now use that password to open the vault on your other devices too.

- To add a passkey, open **Passkeys** in the menu.
- To save an encrypted backup, open **Backup & Restore** and choose a separate backup password.
- To install the app, use your browser's **Install** or **Add to home screen** option.

## Local development

Set up a local development environment with hot-reloading if you want to develop or contribute to the project:

Before you start, you'll need:

- Git and Node.js 22. The pinned Node.js version is in [`.nvmrc`](./.nvmrc).
- pnpm 9.15.1.
- A Redis database, either local or through [Upstash](#1-prepare-your-credentials).

If pnpm is not installed, run `npm install -g pnpm@9.15.1` after installing Node.js.

**1. Clone and install**

```sh
git clone https://github.com/IAMSDR/MyAuthenticator.git
cd MyAuthenticator
pnpm install
```

**2. Configure your environment**

```sh
cp .env.example .env
```

Open `.env` and fill in your session secret and Upstash credentials. Add `PORT=3000` if you want to use the address below.

<details>
<summary><strong>Using local Redis?</strong></summary>

With Redis running locally, remove both `UPSTASH_REDIS_REST_*` entries from `.env` and set:

```dotenv
REDIS_URL="redis://localhost:6379"
```

Keep `NUXT_SESSION_PASSWORD` and `PORT`. If both Upstash credentials and `REDIS_URL` are set, the app chooses Upstash.

This works with the Node.js server. For Cloudflare Workers, use Upstash's REST credentials.

</details>

**3. Start the dev server**

```sh
pnpm dev
```

Open **[http://localhost:3000](http://localhost:3000)** and [create your vault](#3-create-your-vault). Use `localhost` rather than a local network IP so browser encryption and passkeys can work without HTTPS.

<details>
<summary><strong>Build commands and optional settings</strong></summary>

**Commands**

- `pnpm build` builds for Node.js locally, or for the hosting platform Nuxt detects.
- `pnpm preview` runs a local preview after `pnpm build` and loads your `.env` file.
- `pnpm build:cloudflare` builds for Cloudflare Workers.
- `pnpm run deploy` builds and deploys to Cloudflare with Wrangler.
- `pnpm lint` runs ESLint.

**Optional environment variables**

- `REDIS_URL` sets the Redis TCP connection string for Node.js, if you're not using Upstash.
- `PORT` changes the local server port. The example `.env` uses `3000`.
- `NITRO_PORT` overrides the port for the production server or `pnpm preview`.

</details>

## Offline access

Open and unlock the app while you're online at least once on each device. This lets the browser save the app, your account data with encrypted OTP secrets, and a password-encrypted copy of the vault key.

- You can then unlock your saved accounts with your vault password and get codes offline.
- Adding, editing, deleting, or restoring accounts needs a connection, as does managing authentication settings.
- When you're back online, the app refreshes your account data and checks for updates.

If you clear your browser's data or switch to a new device, you'll need to open the app online again first.

## How security works

Here's what the app encrypts and what the server stores:

- **OTP secrets** are encrypted and decrypted in your browser using AES-256-GCM.
- **The vault key** is created in the browser and saved only in encrypted form. While the vault is open, the unlocked key stays in browser memory.
- **Your vault password** is sent over HTTPS during setup and password login. The server stores a bcrypt hash to check login attempts.
- **Account details** such as labels, issuers, icons, and OTP settings are stored without vault encryption.
- **Encrypted backups** protect the exported account data with the backup password you choose. Plain URI exports aren't encrypted.

<details>
<summary><strong>Encryption keys and passkey compatibility</strong></summary>

- During setup, the browser creates a random 256-bit data encryption key (DEK).
- Your password is used with PBKDF2 to derive another key that encrypts the DEK. This is called key wrapping, and it also makes offline unlocking possible.
- A passkey with **WebAuthn PRF** support can wrap and unlock the DEK too. Without PRF support, the passkey can sign you in, but you'll still need your password to open the vault.
- Locking the vault, signing out, or leaving the page clears the unlocked key.

</details>

## Troubleshooting

- **“Redis not configured” or setup won't finish**

  Check that the REST URL and token come from the same Upstash database and that the token has write access. Make sure both values are saved in your host's environment settings.

- **A session password error**

  Check that `NUXT_SESSION_PASSWORD` is at least 32 characters. Restart the local server or redeploy after changing it.

- **Cloudflare build or Redis TCP errors**

  Use `pnpm build:cloudflare` for the build and Upstash REST credentials for the database.

- **Camera, passkeys, or encryption aren't working**

  Open the app over HTTPS, or use `localhost` during development. Also check browser support and camera permissions.

- **Your passkey signs in, but the app still asks for a password**

  Your browser or authenticator may not support PRF. Use your vault password to unlock it.

- **You can't unlock offline**

  Open and unlock the app online in the same browser first so it can save the data it needs.

- **The local app uses a different port**

  Check `PORT` in `.env`. The terminal output from `pnpm dev` will show the address to open.

## Contributing

Found a bug or have an idea? [Open an issue](https://github.com/IAMSDR/MyAuthenticator/issues) or send a pull request. If something's broken, include your browser, where you're hosting the app, and the steps to reproduce it.

## License

[GNU Affero General Public License v3.0 (AGPL-3.0)](https://www.gnu.org/licenses/agpl-3.0.en.html)

Copyright (C) 2025 IAMSDR. This program is free software: you can redistribute it and/or modify it under the terms of the AGPL-3.0. Because it is licensed under the AGPL, anyone who runs a modified version as a network service must also make their source available under the same license.
