export default eventHandler(async (event) => {
  await requireUserSession(event);
  const redis = getRedis();
  const raw = await redis.get(redisKeys.passkeys);
  if (!raw) return [];
  const passkeys = JSON.parse(raw) as Array<{ id: string; displayName: string; createdAt: string }>;
  return passkeys.map((p) => ({ id: p.id, displayName: p.displayName, createdAt: p.createdAt }));
});
