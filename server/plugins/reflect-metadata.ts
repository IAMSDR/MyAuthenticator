// Reflect-metadata polyfill.
//
// `@simplewebauthn/server` v14 pulls in `@peculiar/x509` -> `tsyringe`, which
// requires the `reflect-metadata` polyfill to be loaded before any of its
// decorators are evaluated. Without this, the Cloudflare Workers bundle throws
// at startup:
//
//   Uncaught Error: tsyringe requires a reflect polyfill.
//   Please add 'import "reflect-metadata"' to the top of your entry point.
//
// This Nitro plugin is bundled into the server entry and runs once on boot,
// before route handlers (and therefore before SimpleWebAuthn) are used.
import "reflect-metadata";

export default defineNitroPlugin(() => {
  // Intentionally empty: importing the module is the whole point.
});
