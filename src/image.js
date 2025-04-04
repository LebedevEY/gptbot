import axios from "axios";
import { createWriteStream } from 'fs';
import { dirname, resolve } from 'path';
import * as url from "url";
import { promises as fs } from 'fs';
import removeFile from "../utils/removeFile.js";

const __dirname = dirname(url.fileURLToPath(import.meta.url));

export const getImage = async (url, filename) => {
    const imagesDir = resolve(__dirname, '../images');
    
    try {
        await fs.mkdir(imagesDir, { recursive: true });
        const imagePath = resolve(imagesDir, `${filename}.jpg`);
        
        const response = await axios({
            method: "GET",
            url,
            responseType: "stream"
        });
        
        return new Promise((resolve, reject) => {
            const stream = createWriteStream(imagePath);
            response.data.pipe(stream);
            
            stream.on("finish", () => {
                console.log(`Изображение успешно сохранено: ${imagePath}`);
                resolve(imagePath);
            });
            
            stream.on("error", (err) => {
                console.error(`Ошибка при сохранении изображения: ${err.message}`);
                reject(err);
            });
        });
    } catch (err) {
        console.error(`Ошибка при загрузке изображения: ${err.message}`);
        throw err;
    }
};

export const imageToBase64 = async (imagePath) => {
    try {
        const imageBuffer = await fs.readFile(imagePath);
        const base64Image = imageBuffer.toString('base64');
        return base64Image;
    } catch (err) {
        console.error(`Ошибка при конвертации изображения в base64: ${err.message}`);
        throw err;
    }
};

export const cleanupImage = async (imagePath) => {
    try {
        await removeFile(imagePath);
        console.log(`Изображение удалено: ${imagePath}`);
    } catch (err) {
        console.error(`Ошибка при удалении изображения: ${err.message}`);
    }
};
