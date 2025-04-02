import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = path.resolve(__dirname, '../../data/messages.db');

let db;

export const connectDB = async () => {
    try {
        // Убедимся, что директория существует
        await import('fs').then(fs => {
            if (!fs.existsSync(path.dirname(DB_PATH))) {
                fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
            }
        });
        
        db = await open({
            filename: DB_PATH,
            driver: sqlite3.Database
        });
        
        await db.exec(`
            CREATE TABLE IF NOT EXISTS messages (
                userId TEXT PRIMARY KEY,
                messages TEXT
            )
        `);
        
        console.log('Подключение к SQLite установлено');
        return db;
    } catch (err) {
        console.error(`Ошибка подключения к SQLite: ${err.message}`);
        throw err;
    }
};

export const saveUserMessages = async (userId, messages) => {
    if (!db) {
        await connectDB();
    }
    
    try {
        await db.run(
            'INSERT OR REPLACE INTO messages (userId, messages) VALUES (?, ?)',
            userId,
            JSON.stringify(messages)
        );
    } catch (err) {
        console.error(`Ошибка при сохранении сообщений: ${err.message}`);
        throw err;
    }
};

export const loadUserMessages = async (userId) => {
    if (!db) {
        await connectDB();
    }
    
    try {
        const row = await db.get('SELECT messages FROM messages WHERE userId = ?', userId);
        return row ? JSON.parse(row.messages) : [];
    } catch (err) {
        console.error(`Ошибка при загрузке сообщений: ${err.message}`);
        return [];
    }
};

export const getAllUserIds = async () => {
    if (!db) {
        await connectDB();
    }
    
    try {
        const rows = await db.all('SELECT userId FROM messages');
        return rows.map(row => row.userId);
    } catch (err) {
        console.error(`Ошибка при получении списка пользователей: ${err.message}`);
        return [];
    }
};
