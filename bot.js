const TelegramBot = require('node-telegram-bot-api');

// Replace with your actual bot token
const token = '7201017810:AAFMwpK0x_VK0liYn40CWA7o5i9Jxn4j_w4';

// Create a bot instance
const bot = new TelegramBot(token, { polling: true });

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Your link is <your_link_here>');
});
