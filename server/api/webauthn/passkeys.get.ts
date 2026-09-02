export default eventHandler(async (event) => {
  await requireUserSession(event);
  const redis = await getRedis();
  const map = await redis.hgetall(redisKeys.passkeys);
  if (!map || Object.keys(map).length === 0) return [];
  const passkeys: Array<{ id: string; displayName: string; createdAt: string }> = [];
  for (const json of Object.values(map)) {
    try {
      const p = JSON.parse(json) as { id: string; displayName: string; createdAt: string };
      if (p?.id) {
        passkeys.push({ id: p.id, displayName: p.displayName, createdAt: p.createdAt });
      }
    } catch {}
  }
  return passkeys;
});
