export default eventHandler(async (event) => {
  await requireUserSession(event);
  const query = getQuery(event);
  const id = query.id as string | undefined;
  if (!id) throw createError({ statusCode: 400, message: "Missing id" });

  // HDEL returns the number of fields removed — if 0 the account did not exist.
  const commands: [string, ...unknown[]][] = [
    ["HDEL", redisKeys.accounts, id],
    ["HINCRBY", redisKeys.accountsMeta, "version", 1],
    ["HINCRBY", redisKeys.accountsMeta, "count", -1],
    ["HSET", redisKeys.accountsMeta, "updatedAt", new Date().toISOString()],
  ];
  const results = await runTransaction(commands);
  const removed = results[0];
  if (typeof removed === "number" && removed === 0) {
    throw createError({ statusCode: 404, message: "Account not found" });
  }
  const version = versionFromTransaction(results, commands, redisKeys.accountsMeta, "version");
  return { status: 200, message: "Deleted successfully", version };
});
