import { Telegraf } from 'telegraf';
import config from 'config';
import { message } from "telegraf/filters";
import {getFile, oggToMp3} from "./src/audio.js";
import {completion, image, transcription} from "./src/openai.js";
import process from "nodemon";

const bot = new Telegraf(String(config.get('TG_TOKEN')))

const messages = {}

bot.on(message('text'), async (ctx) => {
    const { text } = ctx.message;
    if (Object.keys(messages).includes(String(ctx.update.message.from.id))) {
        if (messages[ctx.update.message.from.id].length < 10) {
            messages[ctx.update.message.from.id].push({
                role: 'user',
                content: text
            })
        } else {
            messages[ctx.update.message.from.id].splice(0, 1)
            messages[ctx.update.message.from.id].push({
                role: 'user',
                content: text
            })
        }
    } else {
        messages[ctx.update.message.from.id] = [{
            role: 'user',
            content: text
        }]
    }
    ctx.replyWithChatAction('typing');
    const response = text.includes('Картинка:') ? await image(text.replace('Картинка: ', '')) : await completion(messages[ctx.update.message.from.id]);
    if (response.content) {
        if (messages[ctx.update.message.from.id].length < 10) {
            messages[ctx.update.message.from.id].push({
                role: 'assistant',
                content: response.content
            })
        } else {
            messages[ctx.update.message.from.id].splice(0, 1)
            messages[ctx.update.message.from.id].push({
                role: 'assistant',
                content: response.content
            })
        }
        await ctx.reply(response.content).catch(err => ctx.reply(err.description || 'WTF'));
    } else if (response.data.created) {
        await ctx.reply(response.data.data[0].url);
    } else {
        await ctx.reply(response.response.data.error.message);
    }
})
bot.on(message('voice'), async (ctx) => {
    const userId = String(ctx.message.from.id)
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
    const oggPath = await getFile(link, userId)
    const mp3Path = await oggToMp3(oggPath, userId)
    const text = await transcription(mp3Path)
    if (Object.keys(messages).includes(ctx.update.message.from.id)) {
        messages[ctx.update.message.from.id].push({
            role: 'user',
            content: text
        })
    } else {
        messages[ctx.update.message.from.id] = [{
            role: 'user',
            content: text
        }]
    }
    ctx.sendChatAction('typing');
    const response = await completion(messages[ctx.update.message.from.id])
    messages[ctx.update.message.from.id].push({
        role: 'assistant',
        content: response.content
    })
    ctx.reply(response.content).catch(err => ctx.reply(err.description || 'WTF'));
})
bot.command('start', async (ctx) => {
    await ctx.reply('Это бот для общения с GPT-4')
})

bot.launch()

console.log('bot started')

process.once('SIGINT', () => bot.stop('SIGINT'))
process.on('SIGTERM', () => bot.stop('SIGTERM'))
