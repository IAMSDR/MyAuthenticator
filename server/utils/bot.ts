import { Bot, InlineKeyboard } from "grammy";

export const useBot = (botToken: string, userId?: number) => {
  const bot = new Bot(botToken);

  bot.command("start", async (ctx) => {
    if (ctx.message?.chat.id !== userId) return;
    const storage = useStorage();
    let miniappUrl = await storage.getItem<string>("miniappUrl");
    if (!miniappUrl) {
      console.log("setting miniappUrl in nitro storage ");
      const webhookInfo = await ctx.api.getWebhookInfo();
      const host = new URL(webhookInfo.url!).host;
      await storage.setItem("miniappUrl", `https://${host}/?tma=true`);
      miniappUrl = await storage.getItem<string>("miniappUrl");
    }
    await ctx.setChatMenuButton({
      chat_id: userId,
      menu_button: {
        text: "webApp",
        type: "web_app",
        web_app: {
          url: miniappUrl!,
        },
      },
    });
    const markup = new InlineKeyboard().webApp("WebApp", miniappUrl!);
    await ctx.reply("Welcome !\nUse below button to launch the miniApp :)", {
      reply_markup: markup,
    });
  });

  return bot;
};
