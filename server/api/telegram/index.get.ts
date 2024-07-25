export default eventHandler(async (event) => {
  const session = await requireUserSession(event);
  const runtimeConfig = useRuntimeConfig(event);
  if (!runtimeConfig.TELEGRAM_BOT_TOKEN || !runtimeConfig.TELEGRAM_USERID) {
    throw createError({
      statusCode: 400,
      message: "Set environment variables to set up your Telegram bot",
    });
  }
  const host =
    getRequestHeader(event, "x-forwarded-host") || getRequestHost(event);
  const bot = useBot(runtimeConfig.TELEGRAM_BOT_TOKEN);
  const webhookData = await bot.api.getWebhookInfo();
  return {
    host: host,
    isSet: webhookData.url ? true : false,
    webhookData: webhookData,
  };
});
