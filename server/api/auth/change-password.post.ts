import { bcryptHash, bcryptVerify } from "../../utils/hash";

export default eventHandler(async (event) => {
  await requireUserSession(event);
  const { data, error } = await readValidatedBody(event, (body) => changePasswordSchema.safeParse(body));
  if (error) throw createError({ statusCode: 400, statusMessage: "Validation Failed", message: error.message });

  const redis = getRedis();
  // Verify old password if provided (recommended); if not provided, require session is still checked
  if (data.oldPassword) {
    const existingHash = await redis.get(redisKeys.passwordHash);
    if (!existingHash) throw createError({ statusCode: 500, message: "Password hash missing" });
    const ok = await bcryptVerify(existingHash, data.oldPassword);
    if (!ok) throw createError({ statusCode: 401, message: "Old password incorrect" });
  }
  const hash = await bcryptHash(data.password);
  await redis.set(redisKeys.passwordHash, hash);
  await redis.set(redisKeys.dekPassword, data.newWrappedDEK);

  return { status: 200, message: "Password changed successfully" };
});
