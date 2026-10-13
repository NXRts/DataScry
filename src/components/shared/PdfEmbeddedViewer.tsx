"use client";

import React, { useState, useEffect } from "react";
import { Download, ExternalLink, FileText, CheckCircle2, X } from "lucide-react";

interface PdfEmbeddedViewerProps {
    blob?: Blob | null;
    url?: string | null;
    fileName: string;
    title?: string;
    fileSize?: number;
    onDownload?: () => void;
    onClose?: () => void;
    accentColor?: "rose" | "purple" | "amber" | "emerald" | "blue";
    heightClassName?: string;
}

export default function PdfEmbeddedViewer({
    blob,
    url: externalUrl,
    fileName,
    title = "Pratinjau Hasil PDF",
    fileSize,
    onDownload,
    onClose,
    accentColor = "emerald",
    heightClassName = "h-[380px] sm:h-[480px] md:h-[650px]"
}: PdfEmbeddedViewerProps) {
    const [objectUrl, setObjectUrl] = useState<string | null>(null);

    useEffect(() => {
        if (externalUrl) {
            setObjectUrl(externalUrl);
            return;
        }

        if (blob) {
            const url = URL.createObjectURL(blob);
            setObjectUrl(url);
            return () => {
                URL.revokeObjectURL(url);
            };
        } else {
            setObjectUrl(null);
        }
    }, [blob, externalUrl]);

    const handleDefaultDownload = () => {
        if (onDownload) {
            onDownload();
            return;
        }

        if (!objectUrl) return;
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (!objectUrl) return null;

    const sizeFormatted = fileSize
        ? (fileSize / 1024 / 1024).toFixed(2) + " MB"
        : blob
        ? (blob.size / 1024 / 1024).toFixed(2) + " MB"
        : null;

    const colorClasses = {
        rose: "bg-rose-500 hover:bg-rose-600 shadow-rose-500/25",
        purple: "bg-purple-500 hover:bg-purple-600 shadow-purple-500/25",
        amber: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/25",
        emerald: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25",
        blue: "bg-blue-500 hover:bg-blue-600 shadow-blue-500/25",
    };

    const downloadBtnColor = colorClasses[accentColor] || colorClasses.emerald;

    return (
        <div className="w-full rounded-2xl glass-panel border border-border overflow-hidden shadow-xl space-y-0 animate-fade-in">
            {/* Top Toolbar */}
            <div className="p-3 sm:p-4 md:px-6 bg-surface/80 border-b border-border/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs sm:text-base text-foreground truncate">{title}</h4>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-foreground/60 truncate">
                            <span className="truncate max-w-40 sm:max-w-xs md:max-w-md">{fileName}</span>
                            {sizeFormatted && (
                                <>
                                    <span>•</span>
                                    <span className="font-semibold text-emerald-500 shrink-0">{sizeFormatted}</span>
                                </>
                            )}
                        </div>
                    </div>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="sm:hidden p-1.5 rounded-lg bg-surface hover:bg-surface/80 text-foreground/60 hover:text-foreground border border-border/60 transition-colors shrink-0"
                            title="Tutup pratinjau"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <a
                        href={objectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-initial px-3 py-1.5 sm:py-2 rounded-xl bg-surface border border-border/80 hover:bg-surface/80 text-foreground/70 hover:text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        title="Buka PDF di tab baru"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Tab Baru</span>
                    </a>

                    <button
                        type="button"
                        onClick={handleDefaultDownload}
                        className={`flex-1 sm:flex-initial px-4 py-1.5 sm:py-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${downloadBtnColor}`}
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh PDF</span>
                    </button>

                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="hidden sm:flex p-2 rounded-xl bg-surface/80 hover:bg-surface text-foreground/60 hover:text-foreground border border-border/60 transition-colors cursor-pointer"
                            title="Tutup pratinjau"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Embedded Iframe */}
            <div className={`w-full ${heightClassName} bg-neutral-950/60 relative`}>
                <iframe
                    src={`${objectUrl}#toolbar=1&navpanes=0`}
                    title={fileName}
                    className="w-full h-full border-none"
                />
            </div>
        </div>
    );
}
