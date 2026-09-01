import { bcryptHash } from "../../utils/hash";

export default eventHandler(async (event) => {
  const { data, error } = await readValidatedBody(event, (body) => setupSchema.safeParse(body));
  if (error) throw createError({ statusCode: 400, statusMessage: "Validation Failed", message: error.message });

  const redis = await getRedis();
  const existing = await redis.get(redisKeys.setupComplete);
  if (existing === "true") throw createError({ statusCode: 409, message: "Already setup" });

  const hash = await bcryptHash(data.password);

  // Generate prfSalt 32B base64url
  const prfSaltBytes = new Uint8Array(32);
  crypto.getRandomValues(prfSaltBytes);
  const prfSalt = Buffer.from(prfSaltBytes).toString("base64url");

  // Batch all setup writes into one atomic transaction (fewer billed commands).
  await runTransaction([
    ["SET", redisKeys.passwordHash, hash],
    ["SET", redisKeys.prfSalt, prfSalt],
    ["SET", redisKeys.dekPassword, data.wrappedDEK],
    ["SET", redisKeys.setupComplete, "true"],
    ["HSET", redisKeys.accountsMeta, { version: "0", updatedAt: new Date().toISOString(), count: "0" }],
    ["DEL", redisKeys.accounts],
  ]);

  await setUserSession(event, { user: "ADMIN" });
  return { status: 200, message: "Setup successful" };
});
