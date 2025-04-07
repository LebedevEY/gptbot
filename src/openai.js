import {OpenAI} from 'openai'
import {createReadStream} from 'fs';

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENAI_KEY,
})

//TODO переделать под новые методы
export const transcription = async (mp3file) => {
    try {
        const res = await openai.audio.transcriptions(
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
        const res = await openai.chat.completions.create({
            model: "meta-llama/llama-4-maverick:free",
            tools: [],
            max_tokens: 500,
            messages,
        })
        return res.choices[0].message
    } catch (err) {
        console.error(`Ошибка запроса к ChatGPT: ${err.message}`)
        return err
    }
}

//TODO переделать под новые методы
export const image = async (prompt) => {
    try {
        return await openai.images.generate({
            prompt,
            n: 1,
            size: '1024x1024'
        })
    } catch (err) {
        console.error(`Ошибка генерации изображения: ${err.message}`)
        return { error: 'Не удалось создать изображение по вашему запросу' }
    }
}

export const imageAnalysis = async (messages, base64Image) => {
    try {
        const messagesWithImage = [
            ...messages.slice(0, -1),
            {
                role: "user",
                content: [
                    { type: "text", text: messages[messages.length - 1].content },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/jpeg;base64,${base64Image}`,
                            detail: 'high'
                        }
                    }
                ]
            }
        ];

        const res = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messagesWithImage
        });

        return res.choices[0].message;
    } catch (err) {
        console.log(JSON.stringify(err, null, 2));
        console.error(`Ошибка при анализе изображения: ${err.message}`);
        return { error: `Не удалось проанализировать изображение: ${err.message}` };
    }
}
