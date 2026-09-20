import { bcryptHash } from "../../utils/hash";

export default eventHandler(async (event) => {
  const { data, error } = await readValidatedBody(event, (body) => setupSchema.safeParse(body));
  if (error) throw createError({ statusCode: 400, statusMessage: "Validation Failed", message: error.message });

  const redis = await getRedis(event);
  // Claim setup with NX lock (60s) to prevent concurrent races
  const claimed = await redis.set(redisKeys.setupComplete, "claimed", { nx: true, ex: 60 });
  if (!claimed) throw createError({ statusCode: 409, message: "Already setup or setup in progress" });

  try {
    const hash = await bcryptHash(data.password);

    const prfSaltBytes = new Uint8Array(32);
    crypto.getRandomValues(prfSaltBytes);
    const prfSalt = Buffer.from(prfSaltBytes).toString("base64url");

    // Batch setup writes atomically (fewer billed commands).
    await runTransaction([
      ["SET", redisKeys.passwordHash, hash],
      ["SET", redisKeys.prfSalt, prfSalt],
      ["SET", redisKeys.dekPassword, data.wrappedDEK],
      ["SET", redisKeys.setupComplete, "true"],
      ["HSET", redisKeys.accountsMeta, { version: "0", updatedAt: new Date().toISOString(), count: "0" }],
      ["DEL", redisKeys.accounts],
    ], event);
  } catch (err) {
    const current = await redis.get(redisKeys.setupComplete);
    if (current === "claimed") {
      await redis.del(redisKeys.setupComplete);
    }
    throw err;
  }

  await setUserSession(event, { user: "ADMIN" });
  return { status: 200, message: "Setup successful" };
});
