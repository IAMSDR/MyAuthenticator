export default defineWebAuthnAuthenticateEventHandler({
  async storeChallenge(event, challenge, attemptId) {
    const redis = await getRedis(event);
    await redis.set(challengeKey(attemptId), challenge, { ex: 60 });
  },
  async getChallenge(event, attemptId) {
    const redis = await getRedis(event);
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
  async getOptions(event) {
    const redis = await getRedis(event);
    const prfSalt = await redis.get(redisKeys.prfSalt);
    if (prfSalt) {
      // PRF `first` must be base64url (not ArrayBuffer) — JSON serializes AB as {}
      return {
        extensions: {
          prf: {
            eval: {
              first: toBase64URL(prfSalt),
            },
          },
        },
      };
    }
    return {};
  },
  // @ts-expect-error simplewebauthn AuthenticatorTransport typing
  async getCredential(event, credentialID) {
    const redis = await getRedis(event);
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
    if (credential?.id && authenticationInfo?.newCounter !== undefined) {
      const redis = await getRedis(event);
      const raw = await redis.hget(redisKeys.passkeys, credential.id);
      if (raw) {
        const passkey = JSON.parse(raw);
        passkey.counter = authenticationInfo.newCounter;
        await redis.hset(redisKeys.passkeys, credential.id, JSON.stringify(passkey));
      }
    }
    await setUserSession(event, { user: "ADMIN" });
  },
});
