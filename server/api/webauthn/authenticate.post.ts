export default defineWebAuthnAuthenticateEventHandler({
  async storeChallenge(event, challenge, attemptId) {
    const redis = await getRedis();
    await redis.set(challengeKey(attemptId), challenge, { ex: 60 });
  },
  async getChallenge(_event, attemptId) {
    const redis = await getRedis();
    const challenge = await redis.getdel(challengeKey(attemptId));
    if (!challenge) {
      throw createError({
        statusCode: 400,
        message: "Challenge not found or expired",
      });
    }
    return challenge;
  },
  // @ts-expect-error simplewebauthn v13 PRF client extension typing
  async getOptions(_event) {
    const redis = await getRedis();
    const prfSalt = await redis.get(redisKeys.prfSalt);
    if (prfSalt) {
      const b64 = prfSalt.replace(/-/g, "+").replace(/_/g, "/");
      const prfBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
      return {
        extensions: {
          prf: {
            eval: {
              first: prfBytes,
            },
          },
        },
      };
    }
    return {};
  },
  // @ts-expect-error simplewebauthn AuthenticatorTransport typing
  async getCredential(_event, credentialID) {
    const redis = await getRedis();
    const raw = await redis.hget(redisKeys.passkeys, credentialID);
    if (!raw) {
      throw createError({
        statusCode: 404,
        statusMessage: "Credential not found",
      });
    }
    const credential = JSON.parse(raw) as { id: string; publicKey: string; counter: number; backedUp: boolean; transports: unknown; displayName: string; user: string; createdAt: string };
    return credential as unknown as { id: string; publicKey: string; counter: number; backedUp: boolean; transports: unknown };
  },
  async onSuccess(event, { credential, authenticationInfo }: { credential?: { id?: string }; authenticationInfo?: { newCounter?: number } }) {
    await setUserSession(event, { user: "ADMIN" });
    if (credential?.id && authenticationInfo?.newCounter !== undefined) {
      try {
        const redis = await getRedis();
        const raw = await redis.hget(redisKeys.passkeys, credential.id);
        if (raw) {
          const passkey = JSON.parse(raw);
          passkey.counter = authenticationInfo.newCounter;
          await redis.hset(redisKeys.passkeys, credential.id, JSON.stringify(passkey));
        }
      } catch (err) {
        console.error("Failed to update passkey counter:", err);
      }
    }
    // Note: wrappedDEK fetch is done via GET /api/webauthn/wrap?credentialId=...
    // If no wrapper exists, client will show "Passkey has no decrypt wrapper, use password login"
  },
});
