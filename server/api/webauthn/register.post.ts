export default defineWebAuthnRegisterEventHandler({
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
  validateUser: (user) => passkeyUser.parseAsync(user),
  async onSuccess(event, { user, credential }) {
    const redis = await getRedis();
    const raw = await redis.get(redisKeys.passkeys);
    const passkeys: Array<{ id: string; displayName: string; user: string; publicKey: string; counter: number; backedUp: boolean; transports: unknown; createdAt: string }> = raw ? (JSON.parse(raw) as typeof passkeys) : [];

    const exists = passkeys.find((p) => p.displayName === user.displayName || p.id === credential.id);
    if (exists) {
      throw createError({
        statusCode: 409,
        message: "Device already registered",
      });
    }
    passkeys.push({
      displayName: user.displayName,
      user: user.userName,
      id: credential.id,
      publicKey: credential.publicKey,
      counter: credential.counter,
      backedUp: credential.backedUp,
      transports: credential.transports,
      createdAt: new Date().toISOString(),
    });
    await redis.set(redisKeys.passkeys, JSON.stringify(passkeys));
  },
});
