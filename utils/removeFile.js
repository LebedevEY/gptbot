import { unlink } from 'fs/promises'
export default async (path) => {
    await unlink(path)
}