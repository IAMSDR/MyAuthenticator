import { describe, it, expect } from "vitest";
import {
  otpSchema,
  algorithmSchema,
  accountSchema,
  cipherAccountSchema,
  passwordSchema,
  setupSchema,
  changePasswordSchema,
  accountsMetaSchema,
  cacheSchema,
  folderSchema,
  passkeyUser,
} from "../shared/types";

// These tests guard the zod v4 migration. zod v4 removed the `.Values`
// accessor (replaced by `.enum`), dropped `ZodError.errors` in favour of
// `.issues`, and changed error wording. The assertions below are written to be
// resilient to message wording while still pinning behaviour.

describe("zod v4 enum schemas (replaces .Values with .enum)", () => {
  it("otpSchema exposes .enum with TOTP/HOTP and no .Values", () => {
    expect(otpSchema.enum).toEqual({ TOTP: "TOTP", HOTP: "HOTP" });
    expect((otpSchema as unknown as { Values?: unknown }).Values).toBeUndefined();
    expect(otpSchema.parse("TOTP")).toBe("TOTP");
    expect(otpSchema.parse("HOTP")).toBe("HOTP");
    expect(otpSchema.safeParse("nope").success).toBe(false);
  });

  it("algorithmSchema exposes .enum with SHA1/SHA256/SHA512", () => {
    expect(algorithmSchema.enum).toEqual({
      SHA1: "SHA1",
      SHA256: "SHA256",
      SHA512: "SHA512",
    });
    expect(algorithmSchema.safeParse("SHA256").success).toBe(true);
    expect(algorithmSchema.safeParse("MD5").success).toBe(false);
  });
});

describe("accountSchema", () => {
  const valid = {
    type: "TOTP",
    issuer: "Example",
    label: "alice@example.com",
    icon: "i-lucide-circle",
    secret: "JBSWY3DPEHPK3PXP",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    counter: 0,
  };

  it("accepts a valid account", () => {
    expect(accountSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects digits outside 6-8 and reports via .issues (not .errors)", () => {
    const res = accountSchema.safeParse({ ...valid, digits: 9 });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(Array.isArray(res.error.issues)).toBe(true);
      expect(res.error.issues.length).toBeGreaterThan(0);
      // zod v4 removed ZodError.errors; ensure the deprecated alias isn't relied on.
      expect((res.error as unknown as { errors?: unknown }).errors).toBeUndefined();
    }
  });

  it("rejects periods outside 5-60", () => {
    expect(accountSchema.safeParse({ ...valid, period: 4 }).success).toBe(false);
    expect(accountSchema.safeParse({ ...valid, period: 61 }).success).toBe(false);
  });

  it("rejects a secret with invalid base32 characters", () => {
    expect(
      accountSchema.safeParse({ ...valid, secret: "invalid!@#" }).success,
    ).toBe(false);
  });

  it("rejects an empty label", () => {
    expect(accountSchema.safeParse({ ...valid, label: "" }).success).toBe(false);
  });

  it("accepts an optional uuid id, and rejects a non-uuid id", () => {
    const uuid = "123e4567-e89b-42d3-a456-426614174000";
    expect(accountSchema.safeParse({ ...valid, id: uuid }).success).toBe(true);
    expect(accountSchema.safeParse({ ...valid, id: "not-a-uuid" }).success).toBe(false);
  });
});

describe("cipherAccountSchema (ciphertext secret, required timestamps)", () => {
  const valid = {
    id: "123e4567-e89b-42d3-a456-426614174000",
    type: "HOTP",
    issuer: "Example",
    label: "bob",
    icon: "i-lucide-circle",
    secret: "ciphertext-base64==",
    algorithm: "SHA512",
    digits: 8,
    period: 60,
    counter: 42,
    createdAt: new Date().toISOString(),
  };

  it("accepts valid ciphertext account", () => {
    expect(cipherAccountSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects missing createdAt", () => {
    const { createdAt: _omit, ...rest } = valid;
    expect(cipherAccountSchema.safeParse(rest).success).toBe(false);
  });
});

describe("password / setup / changePassword schemas", () => {
  const strong = "Abcdef1!";

  it("passwordSchema enforces complexity", () => {
    expect(passwordSchema.safeParse({ password: strong }).success).toBe(true);
    expect(passwordSchema.safeParse({ password: "weakpassword" }).success).toBe(false);
    expect(passwordSchema.safeParse({ password: "Abcdef1" }).success).toBe(false); // <8
  });

  it("setupSchema requires wrappedDEK", () => {
    expect(
      setupSchema.safeParse({ password: strong, wrappedDEK: "x" }).success,
    ).toBe(true);
    expect(setupSchema.safeParse({ password: strong, wrappedDEK: "" }).success).toBe(false);
  });

  it("changePasswordSchema requires oldPassword and newWrappedDEK", () => {
    expect(
      changePasswordSchema.safeParse({
        password: strong,
        oldPassword: "Oldpass1!",
        newWrappedDEK: "d",
      }).success,
    ).toBe(true);
    expect(
      changePasswordSchema.safeParse({ password: strong, newWrappedDEK: "d" }).success,
    ).toBe(false);
  });
});

describe("zod v4 z.record (2-arg form) in cacheSchema", () => {
  it("parses a record of cipher accounts", () => {
    const account = {
      id: "123e4567-e89b-42d3-a456-426614174000",
      type: "TOTP",
      issuer: "X",
      label: "y",
      icon: "i-lucide-circle",
      secret: "ct",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      counter: 0,
      createdAt: new Date().toISOString(),
    };
    const res = cacheSchema.safeParse({
      version: 1,
      updatedAt: new Date().toISOString(),
      map: { abc: account },
    });
    expect(res.success).toBe(true);
  });
});

describe("misc schemas", () => {
  it("accountsMetaSchema validates integers >= 0", () => {
    expect(
      accountsMetaSchema.safeParse({ version: 1, updatedAt: "t", count: 0 }).success,
    ).toBe(true);
    expect(
      accountsMetaSchema.safeParse({ version: -1, updatedAt: "t", count: 0 }).success,
    ).toBe(false);
  });

  it("folderSchema requires a non-empty name", () => {
    expect(
      folderSchema.safeParse({ id: "1", name: "Personal", createdAt: "t" }).success,
    ).toBe(true);
    expect(
      folderSchema.safeParse({ id: "1", name: "", createdAt: "t" }).success,
    ).toBe(false);
  });

  it("passkeyUser requires non-empty userName and displayName", () => {
    expect(passkeyUser.safeParse({ userName: "u", displayName: "U" }).success).toBe(true);
    expect(passkeyUser.safeParse({ userName: "", displayName: "U" }).success).toBe(false);
  });
});
