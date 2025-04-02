import axios from "axios";
import ffmpeg from 'fluent-ffmpeg'
import installer from '@ffmpeg-installer/ffmpeg'
import { createWriteStream } from 'fs';
import {dirname, resolve} from 'path';
import * as url from "url";
import removeFile from "../utils/removeFile.js";

const __dirname = dirname(url.fileURLToPath(import.meta.url));
ffmpeg.setFfmpegPath(installer.path)

export const oggToMp3 = (input, output) => {
    const outputPath = resolve(dirname(input), `${output}.mp3`)
    return new Promise((resolve, reject) => {
        ffmpeg(input)
            .inputOptions('-t 30')
            .output(outputPath)
            .on('end', () => {
                console.log(`Конвертация завершена: ${input} -> ${outputPath}`)
                removeFile(input)
                    .then(() => resolve(outputPath))
                    .catch(err => {
                        console.error(`Ошибка при удалении файла ${input}: ${err.message}`)
                        resolve(outputPath)
                    })
            })
            .on('error', (err) => {
                console.error(`Ошибка при конвертации: ${err.message}`)
                reject(err)
            })
            .run()
    })
}

export const getFile = async (url, filename) => {
    const oggPath = resolve(__dirname, '../voices', `${filename}.ogg`)
    try {
        const res = await axios({
            method: "GET",
            url,
            responseType: "stream"
        })
        
        return new Promise((resolve, reject) => {
            const stream = createWriteStream(oggPath)
            res.data.pipe(stream);
            
            stream.on("finish", () => {
                console.log(`Файл успешно сохранен: ${oggPath}`)
                resolve(oggPath)
            })
            
            stream.on("error", (err) => {
                console.error(`Ошибка при сохранении файла: ${err.message}`)
                reject(err)
            })
        })
    } catch (err) {
        console.error(`Ошибка при загрузке файла: ${err.message}`)
        throw err
    }
}