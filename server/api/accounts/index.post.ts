export default eventHandler(async (event) => {
  await requireUserSession(event);
  const body = await readBody(event);

  // Support single cipherAccount or array
  let cipherAccounts: CipherAccount[];
  if (Array.isArray(body)) {
    const parsed = cipherAccountsSchema.safeParse(body);
    if (!parsed.success) throw createError({ statusCode: 400, message: "Validation Failed", cause: parsed.error.message });
    cipherAccounts = parsed.data;
  } else {
    const parsed = cipherAccountSchema.safeParse(body);
    if (!parsed.success) throw createError({ statusCode: 400, message: "Validation Failed", cause: parsed.error.message });
    cipherAccounts = [parsed.data];
  }

  if (cipherAccounts.length === 0) throw createError({ statusCode: 400, message: "No accounts provided" });

  // Deduplicate cipherAccounts by id (last one wins if duplicated in same batch)
  const uniqueMap = new Map<string, CipherAccount>();
  for (const acc of cipherAccounts) {
    uniqueMap.set(acc.id, acc);
  }
  const uniqueAccounts = Array.from(uniqueMap.values());

  const redis = await getRedis();
  // Check which account IDs already exist to only increment `count` for net-new records
  let newRecordsCount = 0;
  for (const acc of uniqueAccounts) {
    const exists = redis.hexists
      ? (await redis.hexists(redisKeys.accounts, acc.id)) === 1
      : (await redis.hget(redisKeys.accounts, acc.id)) !== null;
    if (!exists) newRecordsCount++;
  }

  const now = new Date().toISOString();
  const commands: [string, ...unknown[]][] = [];
  for (const acc of uniqueAccounts) {
    if (!acc.createdAt) acc.createdAt = now;
    commands.push(["HSET", redisKeys.accounts, acc.id, JSON.stringify(acc)]);
  }
  commands.push(["HINCRBY", redisKeys.accountsMeta, "version", 1]);
  commands.push(["HSET", redisKeys.accountsMeta, "updatedAt", now]);
  if (newRecordsCount > 0) {
    commands.push(["HINCRBY", redisKeys.accountsMeta, "count", newRecordsCount]);
  }

  const results = await runTransaction(commands);
  const version = versionFromTransaction(results, commands, redisKeys.accountsMeta, "version");
  return { status: 200, message: "Added successfully", version }; 
});
