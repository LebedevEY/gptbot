import {Configuration, OpenAIApi} from 'openai'
import config from "config";
import {createReadStream} from 'fs';

const configuration = new Configuration({
    apiKey: config.get('OPENAI_KEY')
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
        console.error(e.message)
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
        return err
    }
}

export const image = async (prompt) => {
    try {
        return await openai.createImage({
            prompt,
            n: 1,
            size: '1024x1024'
        })
    } catch (err) {
        return 'Хер тебе, а не картинка!'
    }
}
