"use client";

import { useEffect, useRef } from "react";
import Dropzone from "@/components/ui/Dropzone";
import FilePreview from "@/components/ui/FilePreview";
import { useFiles } from "@/hooks/useFiles";
import imageCompression from 'browser-image-compression';
import ExifReader from 'exifreader';
import { PDFDocument } from 'pdf-lib';

interface ClientHomeProps {
    defaultAction?: "compress" | "scrub";
}

export default function ClientHome({ defaultAction }: ClientHomeProps) {
    const { files, addFiles, removeFile, updateStatus } = useFiles();

    const handleFiles = async (newFiles: File[]) => {
        await addFiles(newFiles);
    };

    const handleAction = async (id: string, actionType: "compress" | "scrub" | "pdf-merge") => {
        const fileRecord = files.find(f => f.id === id);
        if (!fileRecord) return;
        const file = fileRecord.originalBlob as File;

        await updateStatus(id, { status: 'processing', progress: 5 });

        try {
            if (file.type.startsWith('image/')) {
                if (actionType === 'compress') {
                    const options = {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1920,
                        useWebWorker: true, // Use built-in web worker
                        onProgress: (p: number) => updateStatus(id, { progress: p })
                    };
                    const compressedFile = await imageCompression(file, options);
                    await updateStatus(id, {
                        status: 'success',
                        progress: 100,
                        processedBlob: compressedFile,
                        metadata: { originalSize: file.size, newSize: compressedFile.size }
                    });
                } else if (actionType === 'scrub') {
                    await updateStatus(id, { progress: 30 });
                    const tags = await ExifReader.load(file);
                    await updateStatus(id, { progress: 50 });

                    // OffscreenCanvas is supported in modern browsers
                    const bitmap = await self.createImageBitmap(file);
                    const canvas = document.createElement('canvas');
                    canvas.width = bitmap.width;
                    canvas.height = bitmap.height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) ctx.drawImage(bitmap, 0, 0);

                    await updateStatus(id, { progress: 80 });

                    canvas.toBlob(async (blob) => {
                        if (blob) {
                            await updateStatus(id, {
                                status: 'success',
                                progress: 100,
                                processedBlob: blob,
                                metadata: { scrubbed: true, tagsRemoved: Object.keys(tags).length }
                            });
                        } else {
                            throw new Error("Blob conversion failed");
                        }
                    }, 'image/jpeg', 0.95);
                }
            } else if (file.type === 'application/pdf') {
                if (actionType === 'compress') {
                    await updateStatus(id, { progress: 30 });
                    const arrayBuffer = await file.arrayBuffer();
                    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

                    await updateStatus(id, { progress: 60 });
                    pdfDoc.setTitle('');
                    pdfDoc.setAuthor('');
                    pdfDoc.setSubject('');
                    pdfDoc.setKeywords([]);
                    pdfDoc.setProducer('');
                    pdfDoc.setCreator('');

                    await updateStatus(id, { progress: 80 });
                    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
                    const optimizedBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

                    await updateStatus(id, {
                        status: 'success',
                        progress: 100,
                        processedBlob: optimizedBlob,
                        metadata: { originalSize: file.size, newSize: optimizedBlob.size }
                    });
                }
            }
        } catch (error) {
            console.error("Processing error:", error);
            await updateStatus(id, { status: 'error' });
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
        const newName = `${originalName.join('.')}-datascry.${ext}`;

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
                                defaultAction={defaultAction}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
