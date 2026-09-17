export default eventHandler(async (event) => {
  const redis = await getRedis(event);
  const setupComplete = await redis.get(redisKeys.setupComplete);
  return { setupComplete: setupComplete === "true" };
});
