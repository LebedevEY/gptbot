import 'dotenv/config';
import { Telegraf } from 'telegraf';
import config from 'config';
import { message } from "telegraf/filters";
import {getFile, oggToMp3} from "./src/audio.js";
import {completion, image, transcription} from "./src/openai.js";
import process from "process";
import { connectDB, saveUserMessages, loadUserMessages } from "./utils/db/messageStorage.js";

const bot = new Telegraf(process.env.TG_TOKEN)

const updateMessages = async (userId, role, content) => {
    const messages = await loadUserMessages(userId);
    messages.push({ role, content });
    await saveUserMessages(userId, messages);
    return messages;
}

const initializeBot = async () => {
    try {
        await connectDB();
        console.log('База данных успешно инициализирована');
    } catch (err) {
        console.error(`Ошибка инициализации базы данных: ${err.message}`);
        process.exit(1);
    }
}

bot.on(message('text'), async (ctx) => {
    const { text } = ctx.message;
    const userId = String(ctx.update.message.from.id);
    
    const updatedMessages = await updateMessages(userId, 'user', text);
    
    await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
    
    try {
        const response = text.includes('Картинка:') 
            ? await image(text.replace('Картинка: ', '')) 
            : await completion(updatedMessages);
            
        if (response.content) {
            await updateMessages(userId, 'assistant', response.content);
            await ctx.reply(response.content);
        } else if (response.data?.created) {
            await ctx.reply(response.data.data[0].url);
        } else if (response.response?.data?.error?.message) {
            await ctx.reply(response.response.data.error.message);
        } else {
            await ctx.reply('Произошла ошибка при обработке запроса');
        }
    } catch (err) {
        await ctx.reply(err.description || 'Произошла непредвиденная ошибка');
    }
})

bot.on(message('voice'), async (ctx) => {
    const userId = String(ctx.message.from.id);
    
    try {
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        const oggPath = await getFile(link, userId);
        const mp3Path = await oggToMp3(oggPath, userId);
        const text = await transcription(mp3Path);
        
        const updatedMessages = await updateMessages(userId, 'user', text);
        
        await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
        
        const response = await completion(updatedMessages);
        await updateMessages(userId, 'assistant', response.content);
        
        await ctx.reply(response.content);
    } catch (err) {
        await ctx.reply(err.description || 'Произошла ошибка при обработке голосового сообщения');
    }
})

bot.command('start', async (ctx) => {
    await ctx.reply('Это бот для общения с GPT-4');
})

bot.command('clear', async (ctx) => {
    const userId = String(ctx.message.from.id);
    await saveUserMessages(userId, []);
    await ctx.reply('История сообщений очищена');
});

initializeBot().then(() => {
    bot.launch();
    console.log('Бот запущен');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.on('SIGTERM', () => bot.stop('SIGTERM'));
