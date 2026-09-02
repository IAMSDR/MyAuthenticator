export default defineWebAuthnAuthenticateEventHandler({
  async storeChallenge(event, challenge, attemptId) {
    const redis = await getRedis();
    await redis.set(challengeKey(attemptId), challenge, { ex: 60 });
  },
  async getChallenge(event, attemptId) {
    const redis = await getRedis();
    const challenge = await redis.get(challengeKey(attemptId));
    if (!challenge) {
      throw createError({
        statusCode: 400,
        message: "Challenge not found or expired",
      });
    }
    await redis.del(challengeKey(attemptId));
    return challenge as string;
  },
  // @ts-expect-error simplewebauthn AuthenticatorTransport typing
  async getCredential(event, credentialID) {
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
  async onSuccess(event) {
    await setUserSession(event, { user: "ADMIN" });
    // Note: wrappedDEK fetch is done via GET /api/webauthn/wrap?credentialId=...
    // If no wrapper exists, client will show "Passkey has no decrypt wrapper, use password login"
  },
});
