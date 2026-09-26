"use client";

import { useEffect, useRef, useState } from "react";
import Dropzone from "@/components/ui/Dropzone";
import FilePreview from "@/components/ui/FilePreview";
import { useFiles } from "@/hooks/useFiles";
import imageCompression from 'browser-image-compression';
import ExifReader from 'exifreader';
import { PDFDocument } from 'pdf-lib';
import { RotateCcw } from "lucide-react";
import MediaLightboxModal, { LightboxItem } from "@/components/shared/MediaLightboxModal";

interface ClientHomeProps {
    defaultAction?: "compress" | "scrub";
}

export default function ClientHome({ defaultAction }: ClientHomeProps) {
    const { files, addFiles, removeFile, updateStatus, clearAll } = useFiles();
    const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null);

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

                    const blob = await new Promise<Blob | null>((resolve) => {
                        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95);
                    });

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

    const processAll = async () => {
        if (!defaultAction) return;
        const pendingFiles = files.filter(f => f.status === 'idle');
        for (const file of pendingFiles) {
            await handleAction(file.id, defaultAction);
        }
    };

    const handleDownload = (id: string) => {
        const file = files.find(f => f.id === id);
        if (!file || !file.processedBlob) return;

        const url = URL.createObjectURL(file.processedBlob);
        const a = document.createElement("a");
        a.href = url;

        // Add extension suffix to indicate processing
        const originalName = file.name.split('.');
        const ext = originalName.pop();
        const newName = `${originalName.join('.')}-datascry.${ext}`;

        a.download = newName;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const hasIdleFiles = files.some(f => f.status === 'idle');

    const dropzoneProps = defaultAction === 'scrub' 
        ? {
            accept: "image/*",
            title: "Upload Gambar",
            description: "Mendukung format JPG, PNG, dan WebP. EXIF dan metadata akan dihapus 100% secara lokal.",
            icons: <span className="text-emerald-500 font-bold">Foto & Gambar</span>
        }
        : {
            accept: "image/*,application/pdf",
            title: "Upload Gambar atau PDF",
            description: "Kompresi aman tanpa mengirim file ke server. Mendukung gambar dan dokumen PDF.",
        };

    return (
        <div className="space-y-12">
            <Dropzone onFilesAccepted={handleFiles} {...dropzoneProps} />

            {files.length > 0 && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-2xl font-bold tracking-tight">Your Files ({files.length})</h2>
                        <div className="flex items-center gap-2.5">
                            <button
                                type="button"
                                onClick={() => clearAll()}
                                className="px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                title="Hapus semua berkas"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Clear Semua</span>
                            </button>
                            {defaultAction && hasIdleFiles && (
                                <button
                                    onClick={processAll}
                                    className="px-6 py-2 rounded-xl bg-primary text-white font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 cursor-pointer text-xs sm:text-sm"
                                >
                                    Process All Files
                                </button>
                            )}
                        </div>
                    </div>
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
                                onPreview={() => {
                                    const fileObj = file.originalBlob as File;
                                    if (fileObj.type.startsWith("image/")) {
                                        const url = URL.createObjectURL(fileObj);
                                        setLightboxItem({
                                            url,
                                            title: fileObj.name,
                                            size: fileObj.size,
                                            mimeType: fileObj.type
                                        });
                                    }
                                }}
                                defaultAction={defaultAction}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Media Lightbox Modal */}
            <MediaLightboxModal
                isOpen={lightboxItem !== null}
                item={lightboxItem}
                onClose={() => setLightboxItem(null)}
                accentColor="emerald"
            />
        </div>
    );
}
