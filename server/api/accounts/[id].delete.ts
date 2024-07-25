export default eventHandler(async (event) => {
  const session = await requireUserSession(event);
  const id = getRouterParam(event, "id");
  const account = await useDrizzle()
    .delete(tables.accounts)
    .where(and(eq(tables.accounts.id, Number(id))));
  return "Account deleted successfully";
});
