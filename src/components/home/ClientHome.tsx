"use client";

import { useEffect, useRef } from "react";
import Dropzone from "@/components/ui/Dropzone";
import FilePreview from "@/components/ui/FilePreview";
import { useFiles } from "@/hooks/useFiles";
import type { ImageWorkerMessage, ImageWorkerResponse } from "@/workers/image.worker";
import type { PdfWorkerMessage, PdfWorkerResponse } from "@/workers/pdf.worker";
export default function ClientHome() {
    const { files, addFiles, removeFile, updateStatus } = useFiles();
    const imageWorkerRef = useRef<Worker | null>(null);
    const pdfWorkerRef = useRef<Worker | null>(null);

    useEffect(() => {
        // Initialize workers on client side only (using relative paths for bundler compatibility)
        imageWorkerRef.current = new Worker(new URL("../../workers/image.worker.ts", import.meta.url));
        pdfWorkerRef.current = new Worker(new URL("../../workers/pdf.worker.ts", import.meta.url));

        const handleImageWorkerMessage = (e: MessageEvent<ImageWorkerResponse>) => {
            const data = e.data;
            if (data.type === 'progress') {
                updateStatus(data.id, { progress: data.progress });
            } else if (data.type === 'success') {
                updateStatus(data.id, {
                    status: 'success',
                    progress: 100,
                    processedBlob: data.result,
                    metadata: data.metadata
                });
            } else if (data.type === 'error') {
                updateStatus(data.id, { status: 'error' });
                console.error("Image worker error:", data.error);
            }
        };

        const handlePdfWorkerMessage = (e: MessageEvent<PdfWorkerResponse>) => {
            const data = e.data;
            if (data.type === 'progress') {
                updateStatus(data.id, { progress: data.progress });
            } else if (data.type === 'success') {
                updateStatus(data.id, {
                    status: 'success',
                    progress: 100,
                    processedBlob: data.result,
                    metadata: data.metadata
                });
            } else if (data.type === 'error') {
                updateStatus(data.id, { status: 'error' });
                console.error("PDF worker error:", data.error);
            }
        };

        imageWorkerRef.current.addEventListener('message', handleImageWorkerMessage);
        pdfWorkerRef.current.addEventListener('message', handlePdfWorkerMessage);

        return () => {
            imageWorkerRef.current?.terminate();
            pdfWorkerRef.current?.terminate();
        };
    }, [updateStatus]);

    const handleFiles = async (newFiles: File[]) => {
        await addFiles(newFiles);
    };

    const handleAction = async (id: string, actionType: "compress" | "scrub" | "pdf-merge") => {
        const file = files.find(f => f.id === id);
        if (!file) return;

        await updateStatus(id, { status: 'processing', progress: 0 });

        if (file.type.startsWith('image/') && imageWorkerRef.current) {
            if (actionType === 'compress' || actionType === 'scrub') {
                imageWorkerRef.current.postMessage({
                    type: actionType,
                    id,
                    file: file.originalBlob
                } as ImageWorkerMessage);
            }
        } else if (file.type === 'application/pdf' && pdfWorkerRef.current) {
            if (actionType === 'compress') {
                pdfWorkerRef.current.postMessage({
                    type: 'compress',
                    id,
                    file: file.originalBlob
                } as PdfWorkerMessage);
            }
        }
    };

    const handleDownload = (id: string) => {
        const file = files.find(f => f.id === id);
        if (!file || !file.processedBlob) return;

        const url = URL.createObjectURL(file.processedBlob);
        const a = document.createElement("a");
        a.href = url;

        // Add extension suffix to indicate processing
        const isPdf = file.type === 'application/pdf';
        const originalName = file.name.split('.');
        const ext = originalName.pop();
        const newName = `${originalName.join('.')}-privakit.${ext}`;

        a.download = newName;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-12">
            <Dropzone onFilesAccepted={handleFiles} />

            {files.length > 0 && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold tracking-tight">Your Files ({files.length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {files.map((file) => (
                            <FilePreview
                                key={file.id}
                                file={file.originalBlob as File}
                                progress={file.progress}
                                status={file.status}
                                onRemove={() => removeFile(file.id)}
                                onAction={(type: "compress" | "scrub" | "pdf-merge") => handleAction(file.id, type)}
                                onDownload={() => handleDownload(file.id)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
