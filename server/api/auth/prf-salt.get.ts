export default eventHandler(async () => {
  const redis = getRedis();
  const prfSalt = await redis.get(redisKeys.prfSalt);
  if (!prfSalt) {
    throw createError({ statusCode: 404, message: "PRF salt not found" });
  }
  return { prfSalt };
});
