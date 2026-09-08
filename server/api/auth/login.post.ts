import { bcryptVerify } from "../../utils/hash";

export default eventHandler(async (event) => {
  const { data, error } = await readValidatedBody(event, (body) => loginSchema.safeParse(body));
  if (error) throw createError({ statusCode: 400, statusMessage: "Validation Failed", message: error.message });

  const redis = await getRedis();
  const setupComplete = await redis.get(redisKeys.setupComplete);
  if (setupComplete !== "true") throw createError({ statusCode: 400, message: "Setup not complete" });

  const hash = await redis.get(redisKeys.passwordHash);
  if (!hash) throw createError({ statusCode: 500, message: "Password hash missing" });

  const ip = getRequestIP(event, { xForwardedFor: true }) || "unknown";
  const rateLimitKey = `auth:ratelimit:login:${ip}`;
  const attempts = await redis.get(rateLimitKey);
  const count = attempts ? parseInt(attempts, 10) : 0;
  if (count >= 10) {
    throw createError({
      statusCode: 429,
      message: "Too many failed login attempts. Please try again in 10 minutes.",
    });
  }

  const ok = await bcryptVerify(hash, data.password);
  if (!ok) {
    await redis.set(rateLimitKey, String(count + 1), { ex: 600 });
    throw createError({ statusCode: 401, message: "Invalid Credentials" });
  }

  if (count > 0) {
    await redis.del(rateLimitKey);
  }

  const wrappedDEK = await redis.get(redisKeys.dekPassword);
  if (!wrappedDEK) throw createError({ statusCode: 500, message: "Wrapped DEK missing" });

  await setUserSession(event, { user: "ADMIN" });
  return { status: 200, message: "Login Successful", wrappedDEK };
});
