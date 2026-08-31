export default defineWebAuthnAuthenticateEventHandler({
  async storeChallenge(event, challenge, attemptId) {
    const redis = getRedis();
    await redis.set(challengeKey(attemptId), challenge, { ex: 60 });
  },
  async getChallenge(event, attemptId) {
    const redis = getRedis();
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
  async getCredential(event, credentialID) {
    const redis = getRedis();
    const raw = await redis.get(redisKeys.passkeys);
    const passkeys: Array<{ id: string; publicKey: string; counter: number; backedUp: boolean; transports: unknown; displayName: string; user: string; createdAt: string }> = raw ? (JSON.parse(raw) as typeof passkeys) : [];
    const credential = passkeys.find((p) => p.id === credentialID);
    if (!credential) {
      throw createError({
        statusCode: 404,
        statusMessage: "Credential not found",
      });
    }
    return credential as unknown as { id: string; publicKey: string; counter: number; backedUp: boolean; transports: unknown };
  },
  async onSuccess(event, { credential }) {
    await setUserSession(event, { user: "ADMIN" });
    // Note: wrappedDEK fetch is done via GET /api/webauthn/wrap?credentialId=...
    // If no wrapper exists, client will show "Passkey has no decrypt wrapper, use password login"
  },
});
