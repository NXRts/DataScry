"use client";

import { File, Image as ImageIcon, Trash2, ShieldCheck, Minimize2, FileOutput } from "lucide-react";
import { useMemo } from "react";
import ProgressBar from "./ProgressBar";

interface FilePreviewProps {
    file: File;
    progress?: number;
    status?: "idle" | "processing" | "success" | "error";
    onRemove?: () => void;
    onAction?: (actionType: "compress" | "scrub" | "pdf-merge") => void;
    onDownload?: () => void;
    defaultAction?: "compress" | "scrub";
}

export default function FilePreview({ file, progress = 0, status = "idle", onRemove, onAction, onDownload, defaultAction }: FilePreviewProps) {
    const isImage = file.type.startsWith("image/");
    const isPDF = file.type === "application/pdf";

    const sizeStr = useMemo(() => {
        const mb = file.size / (1024 * 1024);
        if (mb >= 1) return `${mb.toFixed(2)} MB`;
        return `${(file.size / 1024).toFixed(0)} KB`;
    }, [file.size]);

    const objectUrl = useMemo(() => {
        if (isImage) return URL.createObjectURL(file);
        return null;
    }, [file, isImage]);

    return (
        <div className="glass-panel p-4 rounded-2xl flex flex-col gap-4 relative overflow-hidden group">
            {status === "processing" && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex flex-col justify-center px-4">
                    <ProgressBar progress={progress} status={status} label="Processing..." />
                </div>
            )}

            <div className="flex gap-4 items-start">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-surface border border-border flex items-center justify-center">
                    {isImage && objectUrl ? (
                        <img src={objectUrl} alt={file.name} className="w-full h-full object-cover" />
                    ) : isImage ? (
                        <ImageIcon className="text-foreground/40" size={24} />
                    ) : (
                        <File className="text-foreground/40" size={24} />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" title={file.name}>
                        {file.name}
                    </p>
                    <p className="text-xs text-foreground/50">{sizeStr}</p>

                    <div className="mt-2 flex gap-2">
                        {status === "success" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">
                                <ShieldCheck size={12} /> Ready
                            </span>
                        ) : status === "processing" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full">
                                Processing
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-surface border border-border text-foreground/60 px-2 py-0.5 rounded-full">
                                Pending
                            </span>
                        )}
                    </div>
                </div>

                {onRemove && (
                    <button
                        onClick={onRemove}
                        className="p-1.5 text-foreground/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            <div className="pt-3 border-t border-border/50 flex gap-2">
                {status === "success" ? (
                    <button
                        onClick={() => onDownload && onDownload()}
                        className="flex-1 py-2 text-xs font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5"
                    >
                        <FileOutput size={14} /> Download Secure File
                    </button>
                ) : (
                    <>
                        {isImage && (
                            <>
                                {(!defaultAction || defaultAction === "scrub") && (
                                    <button
                                        onClick={() => onAction && onAction("scrub")}
                                        className="flex-1 py-2 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <ShieldCheck size={14} /> Scrub EXIF
                                    </button>
                                )}
                                {(!defaultAction || defaultAction === "compress") && (
                                    <button
                                        onClick={() => onAction && onAction("compress")}
                                        className="flex-1 py-2 text-xs font-semibold rounded-lg bg-surface border border-border hover:bg-border/50 transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <Minimize2 size={14} /> Compress
                                    </button>
                                )}
                            </>
                        )}
                        {isPDF && (!defaultAction || defaultAction === "compress") && (
                            <button
                                onClick={() => onAction && onAction("compress")}
                                className="flex-1 py-2 text-xs font-semibold rounded-lg bg-surface border border-border hover:bg-border/50 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <FileOutput size={14} /> Optimize PDF
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
