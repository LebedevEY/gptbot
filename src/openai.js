import {Configuration, OpenAIApi} from 'openai'
import {createReadStream} from 'fs';

const configuration = new Configuration({
    apiKey: process.env.OPENAI_KEY
})
const openai = new OpenAIApi(configuration)

export const transcription = async (mp3file) => {
    try {
        const res = await openai.createTranscription(
            createReadStream(mp3file),
            'whisper-1'
        )
        return res.data.text
    } catch (e) {
        console.error(`Ошибка транскрипции: ${e.message}`)
        throw e
    }
}

export const completion = async (messages) => {
    try {
        const res = await openai.createChatCompletion({
            model: "gpt-4o-2024-11-20",
            messages,
        })
        return res.data.choices[0].message
    } catch (err) {
        console.error(`Ошибка запроса к ChatGPT: ${err.message}`)
        return err
    }
}

export const image = async (prompt) => {
    try {
        const response = await openai.createImage({
            prompt,
            n: 1,
            size: '1024x1024'
        })
        return response
    } catch (err) {
        console.error(`Ошибка генерации изображения: ${err.message}`)
        return { error: 'Не удалось создать изображение по вашему запросу' }
    }
}
