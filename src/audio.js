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
    return new Promise((resolve) => {
        ffmpeg(input)
            .inputOptions('-t 30')
            .output(outputPath)
            .on('end', () => {
                removeFile(input)
                resolve(outputPath)
            })
            .run()
    })
}

export const getFile = async (url, filename) => {
    const oggPath = resolve(__dirname, '../voices', `${filename}.ogg`)
    const res = await axios({
        method: "GET",
        url,
        responseType: "stream"
    })
    return new Promise((resolve) => {
        const stream = createWriteStream(oggPath)
        res.data.pipe(stream);
        stream.on("finish", () => resolve(oggPath))
    })
}