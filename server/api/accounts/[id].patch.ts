import { AccountEditSchema } from "~/types";

export default eventHandler(async (event) => {
  const session = await requireUserSession(event);
  const id = getRouterParam(event, "id");
  const { data, error } = await readValidatedBody(event, (body) =>
    AccountEditSchema.safeParse(body)
  );
  if (error)
    throw createError({
      statusCode: 400,
      message: "Validation Failed !!",
    });
  await useDrizzle()
    .update(tables.accounts)
    .set(data)
    .where(eq(tables.accounts.id, Number(id)));
  return "Account patched successfully";
});
