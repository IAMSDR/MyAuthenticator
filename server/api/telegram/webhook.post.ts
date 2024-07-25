export default eventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event);
  const bot = useBot(
    runtimeConfig.TELEGRAM_BOT_TOKEN,
    parseInt(runtimeConfig.TELEGRAM_USERID)
  );
  const body = await readBody(event);
  await bot.init();
  await bot.handleUpdate(body);
});
