export default eventHandler(async (event) => {
  await requireUserSession(event);
  const meta = await getAccountsMeta(event);
  const redis = await getRedis(event);
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
