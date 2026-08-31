export default eventHandler(async (event) => {
  await requireUserSession(event);
  const redis = getRedis();
  const order = await redis.get(redisKeys.accountsOrder);
  if (!order) return [];
  try {
    return JSON.parse(order as unknown as string) as string[];
  } catch {
    return [];
  }
});
