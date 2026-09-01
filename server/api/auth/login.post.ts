import { bcryptVerify } from "../../utils/hash";

export default eventHandler(async (event) => {
  const { data, error } = await readValidatedBody(event, (body) => loginSchema.safeParse(body));
  if (error) throw createError({ statusCode: 400, statusMessage: "Validation Failed", message: error.message });

  const redis = await getRedis();
  const setupComplete = await redis.get(redisKeys.setupComplete);
  if (setupComplete !== "true") throw createError({ statusCode: 400, message: "Setup not complete" });

  const hash = await redis.get(redisKeys.passwordHash);
  if (!hash) throw createError({ statusCode: 500, message: "Password hash missing" });

  const ok = await bcryptVerify(hash, data.password);
  if (!ok) throw createError({ statusCode: 401, message: "Invalid Credentials" });

  const wrappedDEK = await redis.get(redisKeys.dekPassword);
  if (!wrappedDEK) throw createError({ statusCode: 500, message: "Wrapped DEK missing" });

  await setUserSession(event, { user: "ADMIN" });
  return { status: 200, message: "Login Successful", wrappedDEK };
});
