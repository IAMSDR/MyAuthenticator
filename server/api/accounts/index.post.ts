import { AccountsSchema } from "~/types";
import { encryptWithKey, importKey } from "~/utils/aes";

export default eventHandler(async (event) => {
  const session = await requireUserSession(event);
  const { data: accounts, error } = await readValidatedBody(event, (body) =>
    AccountsSchema.safeParse(body)
  );
  if (error)
    throw createError({
      statusCode: 400,
      message: "Validation Failed !!",
    });
  const runtimeConfig = useRuntimeConfig(event);
  if (runtimeConfig.DB_ENCRYPTION_PASSWORD) {
    try {
      const key = await importKey(runtimeConfig.DB_ENCRYPTION_PASSWORD);
      for (const account of accounts) {
        account.secret = await encryptWithKey(account.secret, key);
      }
    } catch {
      throw createError({
        statusCode: 400,
        statusText: "Invalid Key",
        message: "Invalid Key - Failed to encrypt accounts",
      });
    }
  }
  await useDrizzle().insert(tables.accounts).values(accounts);
  return "Accounts added successfully";
});
