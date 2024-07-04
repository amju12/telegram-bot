const TelegramBot = require('node-telegram-bot-api');

// Replace with your actual bot token
const token = '6663057274:AAHV-Wf7WVdcHZdTLo9TfOtvRVKSdMH6vuw';

// Create a bot instance
const bot = new TelegramBot(token, { polling: true });

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Your link is <your_link_here>');
});
