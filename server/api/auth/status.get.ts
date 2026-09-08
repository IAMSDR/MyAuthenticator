export default eventHandler(async () => {
  const redis = await getRedis();
  const setupComplete = await redis.get(redisKeys.setupComplete);
  return { setupComplete: setupComplete === "true" };
});
