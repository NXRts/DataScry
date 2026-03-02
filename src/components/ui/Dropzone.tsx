"use client";

import { useState, useCallback } from "react";
import { UploadCloud, File, Image as ImageIcon } from "lucide-react";

interface DropzoneProps {
    onFilesAccepted: (files: File[]) => void;
}

export default function Dropzone({ onFilesAccepted }: DropzoneProps) {
    const [isDragActive, setIsDragActive] = useState(false);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragActive(false);

            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                onFilesAccepted(Array.from(e.dataTransfer.files));
            }
        },
        [onFilesAccepted]
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                onFilesAccepted(Array.from(e.target.files));
            }
        },
        [onFilesAccepted]
    );

    return (
        <div
            className={`relative group w-full p-8 md:p-16 rounded-3xl border-2 border-dashed transition-all duration-300 ${isDragActive
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-border hover:border-primary/50 hover:bg-surface/50 glass-panel"
                }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                multiple
                onChange={handleChange}
                accept="image/*,application/pdf"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />

            <div className="flex flex-col items-center justify-center text-center space-y-6">
                <div
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors duration-300 ${isDragActive
                            ? "bg-primary text-white"
                            : "bg-surface shadow-sm text-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        }`}
                >
                    <UploadCloud className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                    <h3 className="text-2xl font-bold tracking-tight">
                        Drag & Drop Files Here
                    </h3>
                    <p className="text-foreground/60 max-w-sm mx-auto">
                        Support for Images (JPG, PNG, WebP) and PDF documents. All processing is done 100% locally in your browser.
                    </p>
                </div>

                <div className="flex items-center gap-4 text-sm font-medium text-foreground/50">
                    <div className="flex items-center gap-1.5">
                        <ImageIcon size={16} /> Photos
                    </div>
                    <div className="w-1 h-1 rounded-full bg-border" />
                    <div className="flex items-center gap-1.5">
                        <File size={16} /> PDFs
                    </div>
                </div>
            </div>
        </div>
    );
}
