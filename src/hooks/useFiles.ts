"use client";

import { useState, useEffect, useCallback } from "react";
import { PrivaFile, getAllFiles, saveFile, deleteFile, updateFileStatus, clearAllFiles } from "../lib/db";

export function useFiles() {
    const [files, setFiles] = useState<PrivaFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadFiles = useCallback(async () => {
        try {
            const data = await getAllFiles();
            setFiles(data.sort((a, b) => b.createdAt - a.createdAt));
        } catch (error) {
            console.error("Failed to load files from IndexedDB", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    const addFiles = async (newFiles: File[]) => {
        for (const file of newFiles) {
            const record: Omit<PrivaFile, "id" | "createdAt"> = {
                name: file.name,
                type: file.type,
                size: file.size,
                originalBlob: file,
                status: "idle",
                progress: 0,
            };
            await saveFile(record);
        }
        await loadFiles();
    };

    const removeFile = async (id: string) => {
        await deleteFile(id);
        await loadFiles();
    };

    const clearAll = async () => {
        await clearAllFiles();
        await loadFiles();
    };

    const updateStatus = async (id: string, updates: Partial<PrivaFile>) => {
        await updateFileStatus(id, updates);
        // Locally update state to avoid full DB reload for every progress tick
        setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    return {
        files,
        isLoading,
        addFiles,
        removeFile,
        clearAll,
        updateStatus,
    };
}
