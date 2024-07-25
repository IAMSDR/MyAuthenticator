export default eventHandler(async (event) => {
  const session = await requireUserSession(event);
  const runtimeConfig = useRuntimeConfig(event);
  const host =
    getRequestHeader(event, "x-forwarded-host") || getRequestHost(event);
  const webhookUrl = `https://${host}/api/telegram/webhook`;
  const bot = useBot(runtimeConfig.TELEGRAM_BOT_TOKEN);
  const isSet = await bot.api.setWebhook(webhookUrl);
  if (!isSet)
    throw createError({
      statusCode: 401,
      message: "failed to set webhook",
    });
  const storage = useStorage();
  await storage.setItem("miniappUrl", `https://${host}/?tma=true`);
  return "Webhook set successfully !";
});
