export default eventHandler(async (event) => {
  await requireUserSession(event);
  const query = getQuery(event);
  const id = query.id as string | undefined;
  if (!id) throw createError({ statusCode: 400, message: "Missing id" });

  const redis = await getRedis();
  // Pre-check existence so failed/non-existent deletions don't corrupt version, count, or cache metadata
  const exists = redis.hexists
    ? (await redis.hexists(redisKeys.accounts, id)) === 1
    : (await redis.hget(redisKeys.accounts, id)) !== null;
  if (!exists) {
    throw createError({ statusCode: 404, message: "Account not found" });
  }

  const commands: [string, ...unknown[]][] = [
    ["HDEL", redisKeys.accounts, id],
    ["HINCRBY", redisKeys.accountsMeta, "version", 1],
    ["HINCRBY", redisKeys.accountsMeta, "count", -1],
    ["HSET", redisKeys.accountsMeta, "updatedAt", new Date().toISOString()],
  ];
  const results = await runTransaction(commands);
  const version = versionFromTransaction(results, commands, redisKeys.accountsMeta, "version");
  return { status: 200, message: "Deleted successfully", version };
});
