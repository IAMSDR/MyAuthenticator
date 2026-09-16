export default eventHandler(async (event) => {
  await requireUserSession(event);
  const query = getQuery(event);
  if (!query.id) throw createError({ statusCode: 400, message: "Validation Failed" });
  const redis = await getRedis();
  const id = String(query.id);
  await redis.hdel(redisKeys.passkeys, id);
  // also delete PRF wrapper if exists
  await redis.del(dekPrfKey(id));
  return { status: 200, message: "Deleted successfully" };
});
