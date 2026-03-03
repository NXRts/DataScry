import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface PrivaFile {
    id: string; // generated unique id
    name: string;
    type: string;
    size: number;
    originalBlob: Blob;
    processedBlob?: Blob;
    status: "idle" | "processing" | "success" | "error";
    progress: number;
    metadata?: any;
    createdAt: number;
}

interface DataScryDB extends DBSchema {
    files: {
        key: string;
        value: PrivaFile;
        indexes: { "by-created": number };
    };
}

const DB_NAME = 'DataScryDB';
const DB_VERSION = 1;

export async function initDB(): Promise<IDBPDatabase<DataScryDB>> {
    return openDB<DataScryDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('files')) {
                const store = db.createObjectStore('files', { keyPath: 'id' });
                store.createIndex('by-created', 'createdAt');
            }
        },
    });
}

export async function saveFile(file: Omit<PrivaFile, "id" | "createdAt"> & { id?: string }): Promise<string> {
    const db = await initDB();
    const id = file.id || crypto.randomUUID();
    const fileRecord: PrivaFile = {
        ...file,
        id,
        createdAt: Date.now(),
    };
    await db.put('files', fileRecord);
    return id;
}

export async function getFile(id: string): Promise<PrivaFile | undefined> {
    const db = await initDB();
    return db.get('files', id);
}

export async function getAllFiles(): Promise<PrivaFile[]> {
    const db = await initDB();
    return db.getAllFromIndex('files', 'by-created');
}

export async function updateFileStatus(
    id: string,
    data: Partial<Pick<PrivaFile, "status" | "progress" | "processedBlob" | "metadata">>
): Promise<void> {
    const db = await initDB();
    const file = await db.get('files', id);
    if (!file) return;

    await db.put('files', { ...file, ...data });
}

export async function deleteFile(id: string): Promise<void> {
    const db = await initDB();
    await db.delete('files', id);
}

export async function clearAllFiles(): Promise<void> {
    const db = await initDB();
    await db.clear('files');
}
