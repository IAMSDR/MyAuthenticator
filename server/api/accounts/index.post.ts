export default eventHandler(async (event) => {
  await requireUserSession(event);
  const body = await readBody(event);

  // Support single cipherAccount or array
  let cipherAccounts: CipherAccount[] = [];
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

  const now = new Date().toISOString();
  const commands: [string, ...unknown[]][] = [];
  for (const acc of cipherAccounts) {
    if (!acc.createdAt) acc.createdAt = now;
    commands.push(["HSET", redisKeys.accounts, acc.id, JSON.stringify(acc)]);
  }
  commands.push(["HINCRBY", redisKeys.accountsMeta, "version", 1]);
  commands.push(["HSET", redisKeys.accountsMeta, "updatedAt", now]);
  commands.push(["HINCRBY", redisKeys.accountsMeta, "count", cipherAccounts.length]);

  const results = await runTransaction(commands);
  const version = versionFromTransaction(results, commands, redisKeys.accountsMeta, "version");
  return { status: 200, message: "Added successfully", version }; 
});
