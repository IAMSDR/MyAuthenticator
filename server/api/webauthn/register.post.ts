export default defineWebAuthnRegisterEventHandler({
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
  validateUser: (user) => passkeyUser.parseAsync(user),
  async onSuccess(event, { user, credential }) {
    const redis = await getRedis(event);
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

    await redis.hset(redisKeys.passkeys, credential.id, JSON.stringify(passkeyData));
  },
});
