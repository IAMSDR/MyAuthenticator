export default eventHandler(async () => {
  const meta = await getAccountsMeta();
  const redis = await getRedis();
  const rawOrder = await redis.get(redisKeys.accountsOrder);
  let order: string[] = [];
  if (rawOrder) {
    try {
      order = JSON.parse(rawOrder as unknown as string) as string[];
      if (!Array.isArray(order)) order = [];
    } catch {
      order = [];
    }
  }
  return { ...meta, order };
});
