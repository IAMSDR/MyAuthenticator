export default defineWebAuthnRegisterEventHandler({
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
  validateUser: (user) => passkeyUser.parseAsync(user),
  async onSuccess(event, { user, credential }) {
    const redis = await getRedis();
    // Check if device already registered by id in Hash
    const exists = redis.hexists
      ? (await redis.hexists(redisKeys.passkeys, credential.id)) === 1
      : (await redis.hget(redisKeys.passkeys, credential.id)) !== null;
    if (exists) {
      throw createError({
        statusCode: 409,
        message: "Device already registered",
      });
    }

    const passkeyData = {
      displayName: user.displayName,
      user: user.userName,
      id: credential.id,
      publicKey: credential.publicKey,
      counter: credential.counter,
      backedUp: credential.backedUp,
      transports: credential.transports,
      createdAt: new Date().toISOString(),
    };

    // Store in Redis Hash atomically by credential ID
    await redis.hset(redisKeys.passkeys, credential.id, JSON.stringify(passkeyData));
  },
});
