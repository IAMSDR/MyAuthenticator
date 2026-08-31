export default eventHandler(async (event) => {
  await requireUserSession(event);
  const query = getQuery(event);
  if (!query.id) throw createError({ statusCode: 400, message: "Validation Failed" });
  const redis = getRedis();
  const raw = await redis.get(redisKeys.passkeys);
  const passkeys: Array<{ id: string; displayName: string; createdAt: string; [k: string]: unknown }> = raw ? (JSON.parse(raw) as typeof passkeys) : [];
  const filtered = passkeys.filter((p) => p.id !== String(query.id));
  await redis.set(redisKeys.passkeys, JSON.stringify(filtered));
  // also delete PRF wrapper if exists
  await redis.del(dekPrfKey(String(query.id)));
  return { status: 200, message: "Deleted successfully" };
});
