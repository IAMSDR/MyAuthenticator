import { bcryptHash, bcryptVerify } from "../../utils/hash";

export default eventHandler(async (event) => {
  await requireUserSession(event);
  const { data, error } = await readValidatedBody(event, (body) => changePasswordSchema.safeParse(body));
  if (error) throw createError({ statusCode: 400, statusMessage: "Validation Failed", message: error.message });

  const redis = await getRedis();
  // Strictly require and verify current master password before allowing password or DEK change
  const existingHash = await redis.get(redisKeys.passwordHash);
  if (!existingHash) throw createError({ statusCode: 500, message: "Password hash missing" });
  const ok = await bcryptVerify(existingHash, data.oldPassword);
  if (!ok) throw createError({ statusCode: 401, message: "Current password incorrect" });

  const hash = await bcryptHash(data.password);
  await runTransaction([
    ["SET", redisKeys.passwordHash, hash],
    ["SET", redisKeys.dekPassword, data.newWrappedDEK],
  ]);

  return { status: 200, message: "Password changed successfully" };
});
