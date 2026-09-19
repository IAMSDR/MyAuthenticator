#!/usr/bin/env node
// Attach to a Chrome instance over CDP and install a virtual WebAuthn
// authenticator, then hold the connection open so the authenticator stays
// registered for the lifetime of the process.
//
// Usage:
//   1. Launch Chrome with remote debugging, e.g.:
//        chrome --headless=new --remote-debugging-port=9333 \
//               --user-data-dir=/tmp/chrome-profile about:blank
//   2. Point agent-browser at it:  agent-browser connect 9333
//   3. Run:  node e2e/webauthn-virtual-authenticator.mjs
//
// The process writes the authenticator id to stdout and keeps running until
// killed (Ctrl+C). Note: Chrome's virtual authenticator does NOT implement the
// WebAuthn PRF extension, so this is sufficient for *registration* tests but
// not for a full PRF-wrapped passkey login. See e2e/README.md.

import WebSocket from "ws";

const BASE = process.env.CDP_BASE_URL || "http://localhost:9333";
const PAGE_MATCH = process.env.PAGE_MATCH || "9696";

const targets = await (await fetch(`${BASE}/json/list`)).json();
const page =
  targets.find((t) => t.type === "page" && t.url.includes(PAGE_MATCH)) ||
  targets.find((t) => t.type === "page");

if (!page) {
  console.error("No page target found on", BASE);
  process.exit(1);
}

let id = 0;
const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false });
await new Promise((resolve, reject) => {
  ws.on("open", resolve);
  ws.on("error", reject);
});

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const msgId = ++id;
    const onMessage = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === msgId) {
        ws.off("message", onMessage);
        if (msg.error) reject(new Error(`${method}: ${JSON.stringify(msg.error)}`));
        else resolve(msg.result);
      }
    };
    ws.on("message", onMessage);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}

await send("WebAuthn.enable", { enableUI: false });
const { authenticatorId } = await send("WebAuthn.addVirtualAuthenticator", {
  options: {
    protocol: "ctap2",
    transport: "internal",
    hasResidentKey: true,
    hasUserVerification: true,
    isUserVerified: true,
    automaticPresenceSimulation: true,
  },
});

console.log(`Virtual authenticator id: ${authenticatorId}`);
console.log(`Attached to page: ${page.url}`);
console.log("Holding connection open. Press Ctrl+C to remove the authenticator.");

process.on("SIGINT", () => {
  ws.close();
  process.exit(0);
});
