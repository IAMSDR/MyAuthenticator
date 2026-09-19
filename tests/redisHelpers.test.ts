import { describe, it, expect } from "vitest";

// Guards the ioredis v5 -> v6 upgrade.
//
// The app's server/utils/redis.ts constructs an ioredis client with
// `protocol: 2`, because v6 switched the default wire protocol to RESP3 which
// changes reply shapes (hgetall/multi/scan). The Upstash REST path is used for
// the actual live tests; here we verify the pure helper logic that is shared
// between both backends and does not need a connection.

// Import the helper directly. server/utils/redis.ts imports Nitro globals only
// inside functions, so a pure-function import is safe under vitest.
import { versionFromTransaction, redisKeys, dekPrfKey, challengeKey } from "../server/utils/redis";

describe("versionFromTransaction (transaction result indexing)", () => {
  const key = redisKeys.accountsMeta;
  const field = "version";

  it("returns the HINCRBY result at its matching index", () => {
    const commands: [string, ...unknown[]][] = [
      ["HSET", redisKeys.accounts, "a", "1"],
      ["HINCRBY", key, field, 1],
      ["SET", "x", "y"],
    ];
    const results = [1, 7, "OK"];
    expect(versionFromTransaction(results, commands, key, field)).toBe(7);
  });

  it("returns 0 when no HINCRBY for the given key/field exists", () => {
    const commands: [string, ...unknown[]][] = [["SET", "x", "y"]];
    expect(versionFromTransaction(["OK"], commands, key, field)).toBe(0);
  });

  it("returns 0 when the HINCRBY result is not an integer", () => {
    const commands: [string, ...unknown[]][] = [["HINCRBY", key, field, 1]];
    expect(versionFromTransaction(["not-a-number"], commands, key, field)).toBe(0);
  });

  it("is case-insensitive on the command name", () => {
    const commands: [string, ...unknown[]][] = [["hincrby", key, field, 1]];
    expect(versionFromTransaction([3], commands, key, field)).toBe(3);
  });
});

describe("redis key helpers", () => {
  it("builds the per-credential DEK key", () => {
    expect(dekPrfKey("cred-123")).toBe("auth:dek:prf:cred-123");
  });

  it("builds the challenge key", () => {
    expect(challengeKey("attempt-9")).toBe("auth:challenge:attempt-9");
  });

  it("exposes the expected namespaced keys", () => {
    expect(redisKeys.accounts).toBe("accounts");
    expect(redisKeys.passkeys).toBe("passkeys");
    expect(redisKeys.accountsMeta).toBe("accounts:meta");
  });
});
