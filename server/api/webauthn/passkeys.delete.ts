export default eventHandler(async (event) => {
  await requireUserSession(event);
  const query = getQuery(event);
  if (!query.id) throw createError({ statusCode: 400, message: "Validation Failed" });
  const redis = await getRedis(event);
  const id = String(query.id);
  await redis.hdel(redisKeys.passkeys, id);
  await redis.del(dekPrfKey(id));
  return { status: 200, message: "Deleted successfully" };
});
