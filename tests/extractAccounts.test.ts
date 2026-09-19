import { describe, it, expect, beforeAll } from "vitest";
import { extractAccountsFromUriList, maskUriSecret } from "../shared/utils";

// Mock minimal $fetch for icon search in non-browser Node environment
beforeAll(() => {
  const g = globalThis as unknown as { $fetch?: () => Promise<{ icons: string[] }> };
  if (typeof g.$fetch === "undefined") {
    g.$fetch = async () => ({ icons: [] });
  }
});

describe("maskUriSecret", () => {
  it("masks the secret parameter in otpauth URIs", () => {
    const uri = "otpauth://totp/Test:alice?secret=JBSWY3DPEHPK3PXP&issuer=Test";
    const masked = maskUriSecret(uri);
    expect(masked).toBe("otpauth://totp/Test:alice?secret=***&issuer=Test");
    expect(masked).not.toContain("JBSWY3DPEHPK3PXP");
  });

  it("handles case-insensitive secret parameter and trailing params", () => {
    const uri = "otpauth://totp/Test?SECRET=ABCDEF123456&algorithm=SHA1";
    const masked = maskUriSecret(uri);
    expect(masked).toBe("otpauth://totp/Test?secret=***&algorithm=SHA1");
  });
});

describe("extractAccountsFromUriList", () => {
  it("successfully parses valid TOTP and HOTP URIs", async () => {
    const lines = [
      "otpauth://totp/Example:alice@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&algorithm=SHA1&digits=6&period=30",
      "otpauth://hotp/CounterExample:bob?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=CounterExample&counter=42&digits=8",
    ];

    const result = await extractAccountsFromUriList(lines);
    expect(result.accounts).toHaveLength(2);
    expect(result.skipped).toHaveLength(0);

    expect(result.accounts[0].issuer).toBe("Example");
    expect(result.accounts[0].label).toBe("alice@example.com");
    expect(result.accounts[0].type).toBe("TOTP");
    expect(result.accounts[0].secret).toBe("JBSWY3DPEHPK3PXP");
    expect(result.accounts[0].digits).toBe(6);
    expect(result.accounts[0].period).toBe(30);

    expect(result.accounts[1].type).toBe("HOTP");
    expect(result.accounts[1].counter).toBe(42);
    expect(result.accounts[1].digits).toBe(8);
  });

  it("leniently handles blank lines, comments, and CRLF (\\r\\n)", async () => {
    const lines = [
      "",
      "# This is a comment header",
      "  otpauth://totp/Test:one?secret=JBSWY3DPEHPK3PXP&issuer=Test\r",
      "   ",
      "# Another comment",
      "otpauth://totp/Test:two?secret=JBSWY3DPEHPK3PXP&issuer=Test\r",
      "",
    ];

    const result = await extractAccountsFromUriList(lines);
    expect(result.accounts).toHaveLength(2);
    expect(result.skipped).toHaveLength(0);
    expect(result.accounts[0].label).toBe("one");
    expect(result.accounts[1].label).toBe("two");
  });

  it("leniently handles common formatting quirks (SHA-1 hyphen, spaces in secret)", async () => {
    const lines = [
      "otpauth://totp/Test:one?secret=JBSWY3DPEHPK3PXP&issuer=Test&algorithm=SHA-1",
      "otpauth://totp/Test:two?secret=JBSW-Y3DP-EHPK-3PXP&issuer=Test&algorithm=sha-256",
      "otpauth://totp/Test:three?secret=jbsw%20y3dp%20ehpk%203pxp&issuer=Test",
    ];

    const result = await extractAccountsFromUriList(lines);
    expect(result.accounts).toHaveLength(3);
    expect(result.skipped).toHaveLength(0);
    expect(result.accounts[0].algorithm).toBe("SHA1");
    expect(result.accounts[1].algorithm).toBe("SHA256");
    expect(result.accounts[1].secret).toBe("JBSWY3DPEHPK3PXP");
    expect(result.accounts[2].secret).toBe("JBSWY3DPEHPK3PXP");
  });

  it("does not abort on invalid lines; imports valid lines and reports skipped ones with line numbers", async () => {
    const lines = [
      "otpauth://totp/Good:one?secret=JBSWY3DPEHPK3PXP&issuer=Good", // line 1: valid
      "not-an-otpauth-uri", // line 2: invalid scheme
      "otpauth://totp/BadDigits?secret=JBSWY3DPEHPK3PXP&digits=9", // line 3: digits > 8 fails schema
      "otpauth://totp/Good:two?secret=JBSWY3DPEHPK3PXP&issuer=Good", // line 4: valid
      "otpauth://totp/BadSecret?secret=1908invalidcharacters!#", // line 5: bad secret
      "otpauth://totp/Good:three?secret=JBSWY3DPEHPK3PXP&issuer=Good", // line 6: valid
    ];

    const result = await extractAccountsFromUriList(lines);
    expect(result.accounts).toHaveLength(3);
    expect(result.skipped).toHaveLength(3);

    expect(result.accounts.map((a) => a.label)).toEqual(["one", "two", "three"]);

    expect(result.skipped[0].line).toBe(2);
    expect(result.skipped[0].reason).toContain("Not an otpauth:// URI");

    expect(result.skipped[1].line).toBe(3);
    expect(result.skipped[1].reason).toContain("less than or equal to 8");

    expect(result.skipped[2].line).toBe(5);
    expect(result.skipped[2].reason).toBeTruthy();

    // Verify secrets are masked in the skipped objects
    for (const sk of result.skipped) {
      if (sk.uri) {
        expect(sk.uri).not.toContain("JBSWY3DPEHPK3PXP");
        expect(sk.uri).not.toContain("1908invalidcharacters!#");
      }
    }
  });

  it("handles a batch of 35 accounts with some invalid entries without losing the valid ones", async () => {
    const lines: string[] = [];
    for (let i = 1; i <= 35; i++) {
      if (i === 12) {
        // Corrupted algorithm line
        lines.push("otpauth://totp/Service12:user?secret=JBSWY3DPEHPK3PXP&issuer=Service12&algorithm=MD5");
      } else if (i === 24) {
        // Out-of-bounds period
        lines.push("otpauth://totp/Service24:user?secret=JBSWY3DPEHPK3PXP&issuer=Service24&period=999");
      } else {
        lines.push(`otpauth://totp/Service${i}:user${i}@mail.com?secret=JBSWY3DPEHPK3PXP&issuer=Service${i}`);
      }
    }
    // Plus a trailing newline at end of file
    lines.push("");

    const result = await extractAccountsFromUriList(lines);
    expect(result.accounts).toHaveLength(33);
    expect(result.skipped).toHaveLength(2);

    expect(result.skipped[0].line).toBe(12);
    expect(result.skipped[1].line).toBe(24);
  });

  it("handles URI with missing issuer but present label", async () => {
    const lines = ["otpauth://totp/alice@example.com?secret=JBSWY3DPEHPK3PXP"];
    const result = await extractAccountsFromUriList(lines);
    expect(result.accounts).toHaveLength(1);
    expect(result.accounts[0].label).toBe("alice@example.com");
    expect(result.accounts[0].issuer).toBe("");
  });

  it("triggers onProgress callback for each processed item", async () => {
    const lines = [
      "otpauth://totp/Valid:one?secret=JBSWY3DPEHPK3PXP&issuer=Valid",
      "otpauth://totp/Invalid?secret=JBSWY3DPEHPK3PXP&digits=9",
    ];

    const progressCalls: Array<{ current: number; total: number; account?: unknown; skipped?: unknown }> = [];
    const result = await extractAccountsFromUriList(lines, (p) => {
      progressCalls.push(p);
    });

    expect(result.accounts).toHaveLength(1);
    expect(result.skipped).toHaveLength(1);
    expect(progressCalls).toHaveLength(2);
    expect(progressCalls[0].current).toBe(1);
    expect(progressCalls[0].total).toBe(2);
    expect(progressCalls[0].account).toBeTruthy();
    expect(progressCalls[1].current).toBe(2);
    expect(progressCalls[1].total).toBe(2);
    expect(progressCalls[1].skipped).toBeTruthy();
  });
});
