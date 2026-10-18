"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { UploadCloud, File, Image as ImageIcon } from "lucide-react";
import { ALL_TOOLS } from "@/lib/toolsData";

export interface DropzoneProps {
    onFilesAccepted: (files: File[]) => void;
    accept?: string;
    title?: string;
    description?: string;
    icons?: React.ReactNode;
    color?: string;
    className?: string;
}

interface DropzoneTheme {
    idle: string;
    dragActive: string;
    iconIdle: string;
    iconDrag: string;
    mobileBtn: string;
    iconHover: string;
}

const DROPZONE_THEMES: Record<string, DropzoneTheme> = {
    amber: {
        idle: "border-border/80 hover:border-amber-500/60 hover:bg-amber-500/[0.03] hover:shadow-xl hover:shadow-amber-500/10 active:border-amber-500 active:scale-[0.995] focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 glass-panel",
        dragActive: "border-amber-500 bg-amber-500/10 shadow-2xl shadow-amber-500/20 scale-[1.01]",
        iconIdle: "bg-surface border border-border/80 text-foreground/80 shadow-xs sm:shadow-sm group-hover:bg-amber-500/15 group-hover:text-amber-400 group-hover:border-amber-500/40 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-amber-500/20 group-active:scale-95 group-active:bg-amber-500/25",
        iconDrag: "bg-amber-500 text-white border-amber-400 shadow-xl shadow-amber-500/35 scale-110",
        mobileBtn: "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-md shadow-amber-500/25",
        iconHover: "group-hover:text-amber-400",
    },
    orange: {
        idle: "border-border/80 hover:border-orange-500/60 hover:bg-orange-500/[0.03] hover:shadow-xl hover:shadow-orange-500/10 active:border-orange-500 active:scale-[0.995] focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 glass-panel",
        dragActive: "border-orange-500 bg-orange-500/10 shadow-2xl shadow-orange-500/20 scale-[1.01]",
        iconIdle: "bg-surface border border-border/80 text-foreground/80 shadow-xs sm:shadow-sm group-hover:bg-orange-500/15 group-hover:text-orange-400 group-hover:border-orange-500/40 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-orange-500/20 group-active:scale-95 group-active:bg-orange-500/25",
        iconDrag: "bg-orange-500 text-white border-orange-400 shadow-xl shadow-orange-500/35 scale-110",
        mobileBtn: "bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-md shadow-orange-500/25",
        iconHover: "group-hover:text-orange-400",
    },
    emerald: {
        idle: "border-border/80 hover:border-emerald-500/60 hover:bg-emerald-500/[0.03] hover:shadow-xl hover:shadow-emerald-500/10 active:border-emerald-500 active:scale-[0.995] focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 glass-panel",
        dragActive: "border-emerald-500 bg-emerald-500/10 shadow-2xl shadow-emerald-500/20 scale-[1.01]",
        iconIdle: "bg-surface border border-border/80 text-foreground/80 shadow-xs sm:shadow-sm group-hover:bg-emerald-500/15 group-hover:text-emerald-400 group-hover:border-emerald-500/40 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-emerald-500/20 group-active:scale-95 group-active:bg-emerald-500/25",
        iconDrag: "bg-emerald-500 text-white border-emerald-400 shadow-xl shadow-emerald-500/35 scale-110",
        mobileBtn: "bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-md shadow-emerald-500/25",
        iconHover: "group-hover:text-emerald-400",
    },
    purple: {
        idle: "border-border/80 hover:border-purple-500/60 hover:bg-purple-500/[0.03] hover:shadow-xl hover:shadow-purple-500/10 active:border-purple-500 active:scale-[0.995] focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 glass-panel",
        dragActive: "border-purple-500 bg-purple-500/10 shadow-2xl shadow-purple-500/20 scale-[1.01]",
        iconIdle: "bg-surface border border-border/80 text-foreground/80 shadow-xs sm:shadow-sm group-hover:bg-purple-500/15 group-hover:text-purple-400 group-hover:border-purple-500/40 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-purple-500/20 group-active:scale-95 group-active:bg-purple-500/25",
        iconDrag: "bg-purple-500 text-white border-purple-400 shadow-xl shadow-purple-500/35 scale-110",
        mobileBtn: "bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white shadow-md shadow-purple-500/25",
        iconHover: "group-hover:text-purple-400",
    },
    cyan: {
        idle: "border-border/80 hover:border-cyan-500/60 hover:bg-cyan-500/[0.03] hover:shadow-xl hover:shadow-cyan-500/10 active:border-cyan-500 active:scale-[0.995] focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 glass-panel",
        dragActive: "border-cyan-500 bg-cyan-500/10 shadow-2xl shadow-cyan-500/20 scale-[1.01]",
        iconIdle: "bg-surface border border-border/80 text-foreground/80 shadow-xs sm:shadow-sm group-hover:bg-cyan-500/15 group-hover:text-cyan-400 group-hover:border-cyan-500/40 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-cyan-500/20 group-active:scale-95 group-active:bg-cyan-500/25",
        iconDrag: "bg-cyan-500 text-white border-cyan-400 shadow-xl shadow-cyan-500/35 scale-110",
        mobileBtn: "bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white shadow-md shadow-cyan-500/25",
        iconHover: "group-hover:text-cyan-400",
    },
    teal: {
        idle: "border-border/80 hover:border-teal-500/60 hover:bg-teal-500/[0.03] hover:shadow-xl hover:shadow-teal-500/10 active:border-teal-500 active:scale-[0.995] focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 glass-panel",
        dragActive: "border-teal-500 bg-teal-500/10 shadow-2xl shadow-teal-500/20 scale-[1.01]",
        iconIdle: "bg-surface border border-border/80 text-foreground/80 shadow-xs sm:shadow-sm group-hover:bg-teal-500/15 group-hover:text-teal-400 group-hover:border-teal-500/40 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-teal-500/20 group-active:scale-95 group-active:bg-teal-500/25",
        iconDrag: "bg-teal-500 text-white border-teal-400 shadow-xl shadow-teal-500/35 scale-110",
        mobileBtn: "bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white shadow-md shadow-teal-500/25",
        iconHover: "group-hover:text-teal-400",
    },
    rose: {
        idle: "border-border/80 hover:border-rose-500/60 hover:bg-rose-500/[0.03] hover:shadow-xl hover:shadow-rose-500/10 active:border-rose-500 active:scale-[0.995] focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20 glass-panel",
        dragActive: "border-rose-500 bg-rose-500/10 shadow-2xl shadow-rose-500/20 scale-[1.01]",
        iconIdle: "bg-surface border border-border/80 text-foreground/80 shadow-xs sm:shadow-sm group-hover:bg-rose-500/15 group-hover:text-rose-400 group-hover:border-rose-500/40 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-rose-500/20 group-active:scale-95 group-active:bg-rose-500/25",
        iconDrag: "bg-rose-500 text-white border-rose-400 shadow-xl shadow-rose-500/35 scale-110",
        mobileBtn: "bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white shadow-md shadow-rose-500/25",
        iconHover: "group-hover:text-rose-400",
    },
    indigo: {
        idle: "border-border/80 hover:border-indigo-500/60 hover:bg-indigo-500/[0.03] hover:shadow-xl hover:shadow-indigo-500/10 active:border-indigo-500 active:scale-[0.995] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 glass-panel",
        dragActive: "border-indigo-500 bg-indigo-500/10 shadow-2xl shadow-indigo-500/20 scale-[1.01]",
        iconIdle: "bg-surface border border-border/80 text-foreground/80 shadow-xs sm:shadow-sm group-hover:bg-indigo-500/15 group-hover:text-indigo-400 group-hover:border-indigo-500/40 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-indigo-500/20 group-active:scale-95 group-active:bg-indigo-500/25",
        iconDrag: "bg-indigo-500 text-white border-indigo-400 shadow-xl shadow-indigo-500/35 scale-110",
        mobileBtn: "bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white shadow-md shadow-indigo-500/25",
        iconHover: "group-hover:text-indigo-400",
    },
    sky: {
        idle: "border-border/80 hover:border-sky-500/60 hover:bg-sky-500/[0.03] hover:shadow-xl hover:shadow-sky-500/10 active:border-sky-500 active:scale-[0.995] focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 glass-panel",
        dragActive: "border-sky-500 bg-sky-500/10 shadow-2xl shadow-sky-500/20 scale-[1.01]",
        iconIdle: "bg-surface border border-border/80 text-foreground/80 shadow-xs sm:shadow-sm group-hover:bg-sky-500/15 group-hover:text-sky-400 group-hover:border-sky-500/40 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-sky-500/20 group-active:scale-95 group-active:bg-sky-500/25",
        iconDrag: "bg-sky-500 text-white border-sky-400 shadow-xl shadow-sky-500/35 scale-110",
        mobileBtn: "bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white shadow-md shadow-sky-500/25",
        iconHover: "group-hover:text-sky-400",
    },
    fuchsia: {
        idle: "border-border/80 hover:border-fuchsia-500/60 hover:bg-fuchsia-500/[0.03] hover:shadow-xl hover:shadow-fuchsia-500/10 active:border-fuchsia-500 active:scale-[0.995] focus-within:border-fuchsia-500 focus-within:ring-2 focus-within:ring-fuchsia-500/20 glass-panel",
        dragActive: "border-fuchsia-500 bg-fuchsia-500/10 shadow-2xl shadow-fuchsia-500/20 scale-[1.01]",
        iconIdle: "bg-surface border border-border/80 text-foreground/80 shadow-xs sm:shadow-sm group-hover:bg-fuchsia-500/15 group-hover:text-fuchsia-400 group-hover:border-fuchsia-500/40 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-fuchsia-500/20 group-active:scale-95 group-active:bg-fuchsia-500/25",
        iconDrag: "bg-fuchsia-500 text-white border-fuchsia-400 shadow-xl shadow-fuchsia-500/35 scale-110",
        mobileBtn: "bg-fuchsia-500 hover:bg-fuchsia-600 active:bg-fuchsia-700 text-white shadow-md shadow-fuchsia-500/25",
        iconHover: "group-hover:text-fuchsia-400",
    },
    pink: {
        idle: "border-border/80 hover:border-pink-500/60 hover:bg-pink-500/[0.03] hover:shadow-xl hover:shadow-pink-500/10 active:border-pink-500 active:scale-[0.995] focus-within:border-pink-500 focus-within:ring-2 focus-within:ring-pink-500/20 glass-panel",
        dragActive: "border-pink-500 bg-pink-500/10 shadow-2xl shadow-pink-500/20 scale-[1.01]",
        iconIdle: "bg-surface border border-border/80 text-foreground/80 shadow-xs sm:shadow-sm group-hover:bg-pink-500/15 group-hover:text-pink-400 group-hover:border-pink-500/40 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-pink-500/20 group-active:scale-95 group-active:bg-pink-500/25",
        iconDrag: "bg-pink-500 text-white border-pink-400 shadow-xl shadow-pink-500/35 scale-110",
        mobileBtn: "bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white shadow-md shadow-pink-500/25",
        iconHover: "group-hover:text-pink-400",
    },
    red: {
        idle: "border-border/80 hover:border-red-500/60 hover:bg-red-500/[0.03] hover:shadow-xl hover:shadow-red-500/10 active:border-red-500 active:scale-[0.995] focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 glass-panel",
        dragActive: "border-red-500 bg-red-500/10 shadow-2xl shadow-red-500/20 scale-[1.01]",
        iconIdle: "bg-surface border border-border/80 text-foreground/80 shadow-xs sm:shadow-sm group-hover:bg-red-500/15 group-hover:text-red-400 group-hover:border-red-500/40 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-red-500/20 group-active:scale-95 group-active:bg-red-500/25",
        iconDrag: "bg-red-500 text-white border-red-400 shadow-xl shadow-red-500/35 scale-110",
        mobileBtn: "bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-md shadow-red-500/25",
        iconHover: "group-hover:text-red-400",
    },
    blue: {
        idle: "border-border/80 hover:border-blue-500/60 hover:bg-blue-500/[0.03] hover:shadow-xl hover:shadow-blue-500/10 active:border-blue-500 active:scale-[0.995] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 glass-panel",
        dragActive: "border-blue-500 bg-blue-500/10 shadow-2xl shadow-blue-500/20 scale-[1.01]",
        iconIdle: "bg-surface border border-border/80 text-foreground/80 shadow-xs sm:shadow-sm group-hover:bg-blue-500/15 group-hover:text-blue-400 group-hover:border-blue-500/40 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-blue-500/20 group-active:scale-95 group-active:bg-blue-500/25",
        iconDrag: "bg-blue-500 text-white border-blue-400 shadow-xl shadow-blue-500/35 scale-110",
        mobileBtn: "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow-md shadow-blue-500/25",
        iconHover: "group-hover:text-blue-400",
    },
    violet: {
        idle: "border-border/80 hover:border-violet-500/60 hover:bg-violet-500/[0.03] hover:shadow-xl hover:shadow-violet-500/10 active:border-violet-500 active:scale-[0.995] focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 glass-panel",
        dragActive: "border-violet-500 bg-violet-500/10 shadow-2xl shadow-violet-500/20 scale-[1.01]",
        iconIdle: "bg-surface border border-border/80 text-foreground/80 shadow-xs sm:shadow-sm group-hover:bg-violet-500/15 group-hover:text-violet-400 group-hover:border-violet-500/40 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-violet-500/20 group-active:scale-95 group-active:bg-violet-500/25",
        iconDrag: "bg-violet-500 text-white border-violet-400 shadow-xl shadow-violet-500/35 scale-110",
        mobileBtn: "bg-violet-500 hover:bg-violet-600 active:bg-violet-700 text-white shadow-md shadow-violet-500/25",
        iconHover: "group-hover:text-violet-400",
    },
    lime: {
        idle: "border-border/80 hover:border-lime-500/60 hover:bg-lime-500/[0.03] hover:shadow-xl hover:shadow-lime-500/10 active:border-lime-500 active:scale-[0.995] focus-within:border-lime-500 focus-within:ring-2 focus-within:ring-lime-500/20 glass-panel",
        dragActive: "border-lime-500 bg-lime-500/10 shadow-2xl shadow-lime-500/20 scale-[1.01]",
        iconIdle: "bg-surface border border-border/80 text-foreground/80 shadow-xs sm:shadow-sm group-hover:bg-lime-500/15 group-hover:text-lime-400 group-hover:border-lime-500/40 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-lime-500/20 group-active:scale-95 group-active:bg-lime-500/25",
        iconDrag: "bg-lime-500 text-white border-lime-400 shadow-xl shadow-lime-500/35 scale-110",
        mobileBtn: "bg-lime-500 hover:bg-lime-600 active:bg-lime-700 text-white shadow-md shadow-lime-500/25",
        iconHover: "group-hover:text-lime-400",
    },
    green: {
        idle: "border-border/80 hover:border-green-500/60 hover:bg-green-500/[0.03] hover:shadow-xl hover:shadow-green-500/10 active:border-green-500 active:scale-[0.995] focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/20 glass-panel",
        dragActive: "border-green-500 bg-green-500/10 shadow-2xl shadow-green-500/20 scale-[1.01]",
        iconIdle: "bg-surface border border-border/80 text-foreground/80 shadow-xs sm:shadow-sm group-hover:bg-green-500/15 group-hover:text-green-400 group-hover:border-green-500/40 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-green-500/20 group-active:scale-95 group-active:bg-green-500/25",
        iconDrag: "bg-green-500 text-white border-green-400 shadow-xl shadow-green-500/35 scale-110",
        mobileBtn: "bg-green-500 hover:bg-green-600 active:bg-green-700 text-white shadow-md shadow-green-500/25",
        iconHover: "group-hover:text-green-400",
    },
};

export default function Dropzone({
    onFilesAccepted,
    accept = "image/*,application/pdf",
    title = "Drag & Drop Files Here",
    description = "Support for Images (JPG, PNG, WebP) and PDF documents. All processing is done 100% locally in your browser.",
    icons,
    color,
    className = "",
}: DropzoneProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const pathname = usePathname();

    // Automatically resolve theme color from route or prop
    const activeTool = ALL_TOOLS.find(
        (t) => t.href === pathname || (pathname && pathname.startsWith(t.href))
    );
    const resolvedColor = color || activeTool?.color || "blue";
    const theme = DROPZONE_THEMES[resolvedColor] || DROPZONE_THEMES.blue;

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
            className={`relative group w-full p-4 sm:p-8 md:p-14 rounded-2xl sm:rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${
                isDragActive ? theme.dragActive : theme.idle
            } ${className}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                multiple
                onChange={handleChange}
                accept={accept}
                title=""
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />

            <div className="flex flex-col items-center justify-center text-center space-y-3 sm:space-y-5 md:space-y-6 pointer-events-none">
                <div
                    className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        isDragActive ? theme.iconDrag : theme.iconIdle
                    }`}
                >
                    <UploadCloud className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 transition-transform duration-300 group-hover:-translate-y-0.5" />
                </div>

                <div className="space-y-1 sm:space-y-2">
                    <h3 className="text-base sm:text-xl md:text-2xl font-bold tracking-tight px-2 text-foreground transition-colors duration-200">
                        <span className="sm:hidden">Ketuk untuk Memilih Berkas</span>
                        <span className="hidden sm:inline">{title}</span>
                    </h3>
                    <p className="text-foreground/60 max-w-sm mx-auto text-[11px] sm:text-xs md:text-sm px-2 leading-relaxed transition-colors duration-200 group-hover:text-foreground/80">
                        {description}
                    </p>
                    <div className="pt-0.5 sm:hidden">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors duration-200 ${theme.mobileBtn}`}>
                            Pilih dari Galeri / Berkas
                        </span>
                    </div>
                </div>

                {icons ? (
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium text-foreground/60 transition-colors">
                        {icons}
                    </div>
                ) : (
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium text-foreground/50 transition-colors group-hover:text-foreground/75">
                        <div className="flex items-center gap-1.5 transition-colors">
                            <ImageIcon size={14} className={`sm:w-4 sm:h-4 transition-colors ${theme.iconHover}`} /> Photos
                        </div>
                        <div className="w-1 h-1 rounded-full bg-border" />
                        <div className="flex items-center gap-1.5 transition-colors">
                            <File size={14} className={`sm:w-4 sm:h-4 transition-colors ${theme.iconHover}`} /> PDFs
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
