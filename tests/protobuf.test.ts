import { describe, it, expect } from "vitest";
import { Payload } from "../shared/utils/proto/google";
import { extractAccountsFromGoogleUri } from "../shared/utils";
import Long from "long";

// Guards the protobufjs v7 -> v8 upgrade on the generated `google.ts` module.
//
// protobufjs 8 keeps the `minimal.js` runtime API that the generated code uses
// (Reader / Writer / configure / util.Long and Message.encode/decode), so the
// contract below must remain intact. v8 changes some *behavioural* defaults
// (unknown-field discard, proto3 default omission), so a full encode->decode
// round-trip is the meaningful regression check.

const SECRET_B64 = "JBSWY3DPEHPK3PXP";
// base32 secrets are is ascii bytes in the migration payload
const secretBytes = Uint8Array.from(SECRET_B64, (c) => c.charCodeAt(0));

function buildPayload(overrides: Partial<Parameters<typeof Payload.create>[0]> = {}) {
  return Payload.create({
    otpParameters: [
      {
        secret: secretBytes,
        name: "alice@example.com",
        issuer: "Example",
        algorithm: 1, // SHA1
        digits: 6,
        type: 2, // TOTP
        counter: Long.fromNumber(0),
      },
    ],
    version: 1,
    batchSize: 1,
    batchIndex: 0,
    batchId: 12345,
    ...overrides,
  });
}

function toMigrationUri(payload: ReturnType<typeof buildPayload>) {
  const bytes = Payload.encode(payload).finish();
  const b64 = Buffer.from(bytes).toString("base64");
  return { bytes, uri: `otpauth-migration://offline?data=${encodeURIComponent(b64)}` };
}

describe("protobufjs 8: generated Payload encode/decode round-trip", () => {
  it("encodes then decodes preserving scalar and repeated fields", () => {
    const payload = buildPayload();
    const { bytes } = toMigrationUri(payload);
    expect(bytes.length).toBeGreaterThan(0);

    const decoded = Payload.decode(bytes);
    expect(decoded.otpParameters).toHaveLength(1);
    expect(decoded.otpParameters[0].name).toBe("alice@example.com");
    expect(decoded.otpParameters[0].issuer).toBe("Example");
    expect(decoded.otpParameters[0].digits).toBe(6);
    expect(decoded.otpParameters[0].type).toBe(2);
    expect(decoded.version).toBe(1);
    expect(Number(decoded.batchId)).toBe(12345);
  });

  it("preserves the raw secret bytes exactly", () => {
    const payload = buildPayload();
    const decoded = Payload.decode(Payload.encode(payload).finish());
    expect(Array.from(decoded.otpParameters[0].secret)).toEqual(Array.from(secretBytes));
  });

  it("decodes an empty/zeroed payload without throwing", () => {
    const decoded = Payload.decode(new Uint8Array(0));
    expect(decoded.otpParameters).toHaveLength(0);
  });

  it("round-trips multiple otpParameters", () => {
    const payload = Payload.create({
      otpParameters: [
        { secret: secretBytes, name: "a", issuer: "A", algorithm: 1, digits: 6, type: 2, counter: Long.fromNumber(0) },
        { secret: secretBytes, name: "b", issuer: "B", algorithm: 2, digits: 8, type: 1, counter: Long.fromNumber(5) },
      ],
      version: 1,
      batchSize: 2,
      batchIndex: 0,
      batchId: 1,
    });
    const decoded = Payload.decode(Payload.encode(payload).finish());
    expect(decoded.otpParameters.map((p) => p.name)).toEqual(["a", "b"]);
    expect(decoded.otpParameters[1].counter?.toString()).toBe("5");
  });
});

describe("protobufjs 8: Google migration import end-to-end", () => {
  it("extracts a TOTP account from a migration URI", async () => {
    const { uri } = toMigrationUri(buildPayload());
    const accounts = await extractAccountsFromGoogleUri(uri);
    expect(accounts).toBeDefined();
    expect(accounts!.length).toBeGreaterThanOrEqual(1);
    expect(accounts![0].issuer).toBe("Example");
    expect(accounts![0].label).toBe("alice@example.com");
    expect(accounts![0].type).toBe("TOTP");
  });

  it("returns undefined for a URI without a data param", async () => {
    await expect(extractAccountsFromGoogleUri("otpauth-migration://offline")).resolves.toBeUndefined();
  });

  it("returns undefined for corrupt base64 data (no throw)", async () => {
    await expect(
      extractAccountsFromGoogleUri("otpauth-migration://offline?data=!!!not-base64!!!"),
    ).resolves.toBeUndefined();
  });
});
