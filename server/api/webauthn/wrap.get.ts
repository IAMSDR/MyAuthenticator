export default eventHandler(async (event) => {
  await requireUserSession(event);
  const query = getQuery(event);
  const credentialId = query.credentialId as string | undefined;
  if (!credentialId) throw createError({ status: 400, message: "credentialId required" });
  const redis = await getRedis(event);
  const wrapped = await redis.get(dekPrfKey(credentialId));
  if (!wrapped) throw createError({ status: 404, message: "Wrapper not found – Passkey has no decrypt wrapper, use password login" });
  setHeader(event, "Cache-Control", "no-store");
  return { wrappedDEK: wrapped };
});
