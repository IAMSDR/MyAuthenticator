export default eventHandler(async () => {
  const meta = await getAccountsMeta();
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
    let actualCount = 0;
    try {
      if (redis.hlen) actualCount = await redis.hlen(redisKeys.accounts);
      else {
        const all = await redis.hgetall(redisKeys.accounts);
        actualCount = all ? Object.keys(all).length : 0;
      }
    } catch {}
    return { version: 0, updatedAt: new Date(0).toISOString(), count: actualCount, order };
  }
  return { ...meta, order };
});
