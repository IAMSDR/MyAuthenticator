export default eventHandler(async (event) => {
  await requireUserSession(event);
  const body = await readBody(event);
  const { credentialId, wrappedDEK } = body as { credentialId?: string; wrappedDEK?: string };
  if (!credentialId || !wrappedDEK) throw createError({ statusCode: 400, message: "credentialId and wrappedDEK required" });
  const redis = await getRedis(event);
  await redis.set(dekPrfKey(credentialId), wrappedDEK);
  return { status: 200, message: "Wrapper stored" };
});
