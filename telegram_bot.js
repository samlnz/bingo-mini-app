// Use this code with your Telegram Bot API
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot('8520934887:AAFBDNnOh7B_8o-bXMVWVwxL_0dui6HFLMw', {polling: true});

// Set menu button
bot.setChatMenuButton({
    menu_button: {
        type: 'web_app',
        text: '🎮 Play Bingo',
        web_app: {
            url: 'https://your-domain.com/index.html'
        }
    }
});

// Handle /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username;
    
    bot.sendMessage(chatId, `🎯 Welcome ${username} to Beteseb Bingo!`, {
        reply_markup: {
            inline_keyboard: [[
                {
                    text: '🎮 Play Now',
                    web_app: {url: 'https://bingo-mini-app-phi.vercel.app/game.html'}
                }
            ]]
        }
    });
});