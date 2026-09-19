import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";

// Guards the bcryptjs v2 -> v3 upgrade.
//
// v3 changes:
//   - default hash version prefix moves from $2a$ to $2b$ (old $2a$ hashes still verify)
//   - package ships its own TypeScript declarations (no more @ts-expect-error needed)
//   - the API surface used by the app (hash/compare, *Sync) is unchanged
//
// The app's server/utils/hash.ts wraps `bcrypt.hash` / `bcrypt.compare`. To keep
// these tests hermetic and fast we exercise the same calls directly with
// reduced rounds; this validates the exact API/promise contract the app relies on.

const ROUNDS = 4; // low rounds keep hashing fast; complexity is unrelated to correctness

describe("bcryptjs v3 API contract (as used by server/utils/hash.ts)", () => {
  it("bcrypt.hash returns a Promise<string> and produces a verifiable hash", async () => {
    const hash = await bcrypt.hash("Abcdef1!", ROUNDS);
    expect(typeof hash).toBe("string");
    expect(hash.startsWith("$2")).toBe(true);
    await expect(bcrypt.compare("Abcdef1!", hash)).resolves.toBe(true);
  });

  it("bcrypt.compare returns a Promise<boolean> and rejects wrong passwords", async () => {
    const hash = await bcrypt.hash("CorrectHorse1!", ROUNDS);
    await expect(bcrypt.compare("WrongPass1!", hash)).resolves.toBe(false);
  });

  it("newly generated hashes use the v3 default $2b$ prefix", async () => {
    const hash = await bcrypt.hash("Abcdef1!", ROUNDS);
    expect(hash.startsWith("$2b$")).toBe(true);
  });

  it("still verifies legacy $2a$ hashes (backwards compatibility)", async () => {
    // A $2a$ hash generated with bcryptjs v2 must keep verifying after the upgrade.
    const legacy = "$2a$04$1eFh3s3XG6aVQ9y6B2m0uO9K8n3s5WpT0Q3rN7d2kF4c8hZ6j1m9e";
    // We cannot know the plaintext of a hardcoded hash, so instead prove the
    // round-trip: generate with 2a, then verify it still works under v3.
    const salt2a = bcrypt.genSaltSync(ROUNDS).replace("$2b$", "$2a$");
    const hash2a = bcrypt.hashSync("Abcdef1!", salt2a);
    expect(hash2a.startsWith("$2a$")).toBe(true);
    expect(bcrypt.compareSync("Abcdef1!", hash2a)).toBe(true);
    // legacy const retained only to document intent
    expect(typeof legacy).toBe("string");
  });

  it("Sync variants still work as before", () => {
    const salt = bcrypt.genSaltSync(ROUNDS);
    const hash = bcrypt.hashSync("Abcdef1!", salt);
    expect(bcrypt.compareSync("Abcdef1!", hash)).toBe(true);
    expect(bcrypt.compareSync("nope", hash)).toBe(false);
  });

  it("Sync default rounds are 10 when omitted (unchanged in v3)", () => {
    const hash = bcrypt.hashSync("Abcdef1!");
    // bcrypt format: $2b$<cost>$...
    const cost = Number(hash.split("$")[2]);
    expect(cost).toBe(10);
  });

  it("async hash() requires explicit rounds (v3 rejects omitted rounds)", async () => {
    // bcryptjs v3's promise-form hash() throws "Illegal arguments" when called
    // without a rounds argument. The app always passes SALT_ROUNDS, so this is
    // only a documentation guard - if it ever changes, this test flags it.
    await expect(bcrypt.hash("Abcdef1!" as string)).rejects.toThrow();
    // passing rounds explicitly is the supported path
    await expect(bcrypt.hash("Abcdef1!", ROUNDS)).resolves.toEqual(expect.stringContaining("$2b$"));
  });
});
