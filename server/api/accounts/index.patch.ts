export default eventHandler(async (event) => {
  await requireUserSession(event);
  const query = getQuery(event);
  const id = query.id as string | undefined;
  if (!id) throw createError({ statusCode: 400, message: "Missing id" });

  const body = await readBody(event);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw createError({ statusCode: 400, message: "Invalid body" });
  }
  const redis = await getRedis(event);
  const existingJson = await redis.hget(redisKeys.accounts, id);
  if (!existingJson) throw createError({ statusCode: 404, message: "Account not found" });

  const existing = JSON.parse(existingJson as unknown as string) as CipherAccount;

  let merged: CipherAccount;
  if (body.secret !== undefined) {
    const parsed = cipherAccountSchema.safeParse({ ...existing, ...body, id });
    if (!parsed.success) throw createError({ statusCode: 400, message: "Validation Failed", cause: parsed.error.message });
    merged = parsed.data;
  } else {
    const allowed = accountEditSchema.safeParse(body);
    if (!allowed.success) throw createError({ statusCode: 400, message: "Validation Failed", cause: allowed.error.message });
    merged = { ...existing, ...allowed.data } as CipherAccount;
  }

  const now = new Date().toISOString();
  const commands: [string, ...unknown[]][] = [
    ["HSET", redisKeys.accounts, id, JSON.stringify(merged)],
    ["HINCRBY", redisKeys.accountsMeta, "version", 1],
    ["HSET", redisKeys.accountsMeta, "updatedAt", now],
  ];
  const results = await runTransaction(commands, event);
  const version = versionFromTransaction(results, commands, redisKeys.accountsMeta, "version");
  return { status: 200, message: "Updated successfully", version };
});
