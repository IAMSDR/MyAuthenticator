export default eventHandler(async (event) => {
  await clearUserSession(event);
  return { status: 200, message: "Logged out" };
});
