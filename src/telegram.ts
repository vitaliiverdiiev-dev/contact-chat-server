import TelegramBot, { ChatId } from "node-telegram-bot-api";
import { broadcastToClient, onClientMessage } from "./websocket";

let bot: TelegramBot;
let personalChatId: ChatId;

export function initTelegramBot(): void {
  const rawToken = process.env.TELEGRAM_BOT_TOKEN;
  const rawChatId = process.env.TELEGRAM_CHAT_ID;

  if (!rawToken || !rawChatId) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in .env");
  }

  const token: string = rawToken;
  personalChatId = rawChatId;

  bot = new TelegramBot(token, { polling: true });

  console.log("[Telegram] Bot started");

  bot.on("message", (msg) => {
    console.log("[DEBUG] Received message from:", msg.chat.id);
  });

  onClientMessage((clientId, message) => {
    const telegramMessage = `💬 New message from website:\n\n${message}\n\nReply with:\n/reply ${clientId} Your message`;

    bot.sendMessage(personalChatId, telegramMessage);
  });

  bot.onText(/^\/reply (\S+) (.+)/s, (msg, match) => {
    if (!match) return;

    const clientId = match[1];
    const replyText = match[2];

    bot.sendMessage(personalChatId, `✅ Sent reply to client ${clientId}`);
    broadcastToClient(clientId, replyText);
  });

  bot.on("message", (msg) => {
    if (!msg.text?.startsWith("/reply")) {
      bot.sendMessage(
        personalChatId,
        "To reply, use: /reply <clientId> <message>"
      );
    }
  });
}
