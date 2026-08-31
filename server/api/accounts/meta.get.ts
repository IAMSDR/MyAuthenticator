export default eventHandler(async () => {
  const meta = await getAccountsMeta();
  // Fold order into the meta response so cold load is 2 requests (meta + accounts) not 3.
  const redis = getRedis();
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
  if (!meta) {
    return { version: 0, updatedAt: new Date(0).toISOString(), count: 0, order };
  }
  return { ...meta, order };
});
