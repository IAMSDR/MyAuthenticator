export default eventHandler(async (event) => {
  await requireUserSession(event);
  const body = await readBody(event);
  const order = body.order as unknown;
  if (!Array.isArray(order) || !order.every((v) => typeof v === "string")) {
    throw createError({ statusCode: 400, message: "Invalid order array" });
  }
  const commands: [string, ...unknown[]][] = [
    ["SET", redisKeys.accountsOrder, JSON.stringify(order)],
    ["HINCRBY", redisKeys.accountsMeta, "version", 1],
    ["HSET", redisKeys.accountsMeta, "updatedAt", new Date().toISOString()],
  ];
  const results = await runTransaction(commands);
  const version = versionFromTransaction(results, commands, redisKeys.accountsMeta, "version");
  return { status: 200, message: "Order updated", version };
});
