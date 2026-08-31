export default eventHandler(async () => {
  const redis = getRedis();
  const setupComplete = await redis.get(redisKeys.setupComplete);
  return { setupComplete: setupComplete === "true" };
});
