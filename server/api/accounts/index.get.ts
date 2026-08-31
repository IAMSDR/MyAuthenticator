export default eventHandler(async (event) => {
  await requireUserSession(event);
  const redis = getRedis();
  const accountsMap = await redis.hgetall(redisKeys.accounts);
  if (!accountsMap || Object.keys(accountsMap).length === 0) return [];
  const accounts: CipherAccount[] = [];
  for (const json of Object.values(accountsMap)) {
    try {
      const parsed = JSON.parse(json) as CipherAccount;
      if (parsed?.id && parsed?.secret) accounts.push(parsed);
    } catch {
      // skip invalid JSON (corrupted entry)
    }
  }
  return accounts;
});
