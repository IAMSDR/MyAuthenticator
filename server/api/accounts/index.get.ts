import { decryptWithKey, importKey } from "~/utils/aes";

export default eventHandler(async (event) => {
  const session = await requireUserSession(event);
  const runtimeConfig = useRuntimeConfig(event);
  const accounts = await useDrizzle().select().from(tables.accounts).all();
  if (runtimeConfig.DB_ENCRYPTION_PASSWORD) {
    try {
      const key = await importKey(runtimeConfig.DB_ENCRYPTION_PASSWORD);
      for (const account of accounts) {
        account.secret = await decryptWithKey(account.secret, key);
      }
    } catch {
      throw createError({
        statusCode: 400,
        statusText: "Invalid Key",
        message: "Invalid Key - Failed to decrypt accounts",
      });
    }
  }
  return accounts;
});
