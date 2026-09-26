"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    ZoomIn,
    ZoomOut,
    RotateCcw,
    X,
    ChevronLeft,
    ChevronRight,
    Download
} from "lucide-react";

export interface LightboxItem {
    url: string;
    title: string;
    pageNumber?: number;
    totalPages?: number;
    width?: number;
    height?: number;
    size?: number;
    mimeType?: string;
    aspectRatio?: string;
}

interface MediaLightboxModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: LightboxItem | null;
    onNavigatePrev?: () => void;
    onNavigateNext?: () => void;
    hasPrev?: boolean;
    hasNext?: boolean;
    onDownload?: () => void;
    downloadLabel?: string;
    accentColor?: "rose" | "purple" | "amber" | "emerald" | "blue" | "indigo";
}

export default function MediaLightboxModal({
    isOpen,
    onClose,
    item,
    onNavigatePrev,
    onNavigateNext,
    hasPrev = false,
    hasNext = false,
    onDownload,
    downloadLabel = "Unduh",
    accentColor = "amber"
}: MediaLightboxModalProps) {
    const [imageZoom, setImageZoom] = useState<number>(1);
    const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);
    const lightboxBodyRef = useRef<HTMLDivElement>(null);

    // Reset zoom & pan when item changes or modal closes
    useEffect(() => {
        setImageZoom(1);
        setPanOffset({ x: 0, y: 0 });
        setIsDragging(false);
    }, [item?.url, isOpen]);

    const handleZoomIn = () => {
        setImageZoom((prev) => Math.min(4, Math.round((prev + 0.25) * 100) / 100));
    };

    const handleZoomOut = () => {
        setImageZoom((prev) => {
            const next = Math.max(0.5, Math.round((prev - 0.25) * 100) / 100);
            if (next <= 1) setPanOffset({ x: 0, y: 0 });
            return next;
        });
    };

    const handleResetZoom = () => {
        setImageZoom(1);
        setPanOffset({ x: 0, y: 0 });
        setIsDragging(false);
    };

    const handleToggleZoom = () => {
        if (imageZoom === 1) {
            setImageZoom(2);
        } else {
            handleResetZoom();
        }
    };

    // Wheel zoom on the image area
    useEffect(() => {
        const el = lightboxBodyRef.current;
        if (!el || !isOpen) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.deltaY < 0) {
                setImageZoom((prev) => Math.min(4, Math.round((prev + 0.25) * 100) / 100));
            } else {
                setImageZoom((prev) => {
                    const next = Math.max(0.5, Math.round((prev - 0.25) * 100) / 100);
                    if (next <= 1) setPanOffset({ x: 0, y: 0 });
                    return next;
                });
            }
        };

        el.addEventListener("wheel", onWheel, { passive: false });
        return () => {
            el.removeEventListener("wheel", onWheel);
        };
    }, [isOpen]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "ArrowLeft" && hasPrev && onNavigatePrev) {
                onNavigatePrev();
            } else if (e.key === "ArrowRight" && hasNext && onNavigateNext) {
                onNavigateNext();
            } else if (e.key === "+" || e.key === "=") {
                e.preventDefault();
                handleZoomIn();
            } else if (e.key === "-" || e.key === "_") {
                e.preventDefault();
                handleZoomOut();
            } else if (e.key === "0") {
                e.preventDefault();
                handleResetZoom();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, hasPrev, hasNext, onNavigatePrev, onNavigateNext, onClose]);

    // Drag to pan (Mouse)
    const handleMouseDown = (e: React.MouseEvent) => {
        if (imageZoom > 1 && e.button === 0) {
            e.preventDefault();
            setIsDragging(true);
            dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || imageZoom <= 1) return;
        e.preventDefault();
        setPanOffset({
            x: e.clientX - dragStartRef.current.x,
            y: e.clientY - dragStartRef.current.y,
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Drag to pan (Touch)
    const handleTouchStart = (e: React.TouchEvent) => {
        if (imageZoom > 1 && e.touches.length === 1) {
            touchStartRef.current = {
                x: e.touches[0].clientX - panOffset.x,
                y: e.touches[0].clientY - panOffset.y,
            };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (imageZoom > 1 && touchStartRef.current && e.touches.length === 1) {
            setPanOffset({
                x: e.touches[0].clientX - touchStartRef.current.x,
                y: e.touches[0].clientY - touchStartRef.current.y,
            });
        }
    };

    const handleTouchEnd = () => {
        touchStartRef.current = null;
    };

    if (!isOpen || !item) return null;

    // Color variants
    const colorClasses = {
        rose: {
            badge: "bg-rose-500/20 text-rose-400 border-rose-500/30",
            zoomText: "text-rose-400 hover:text-rose-300",
            zoomBadge: "border-rose-500/40 text-rose-400",
            button: "bg-rose-500 hover:bg-rose-600 text-white",
            hoverBg: "hover:bg-rose-500"
        },
        purple: {
            badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
            zoomText: "text-purple-400 hover:text-purple-300",
            zoomBadge: "border-purple-500/40 text-purple-400",
            button: "bg-purple-500 hover:bg-purple-600 text-white",
            hoverBg: "hover:bg-purple-500"
        },
        amber: {
            badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
            zoomText: "text-amber-400 hover:text-amber-300",
            zoomBadge: "border-amber-500/40 text-amber-400",
            button: "bg-amber-500 hover:bg-amber-600 text-white",
            hoverBg: "hover:bg-amber-500"
        },
        emerald: {
            badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
            zoomText: "text-emerald-400 hover:text-emerald-300",
            zoomBadge: "border-emerald-500/40 text-emerald-400",
            button: "bg-emerald-500 hover:bg-emerald-600 text-white",
            hoverBg: "hover:bg-emerald-500"
        },
        blue: {
            badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
            zoomText: "text-blue-400 hover:text-blue-300",
            zoomBadge: "border-blue-500/40 text-blue-400",
            button: "bg-blue-500 hover:bg-blue-600 text-white",
            hoverBg: "hover:bg-blue-500"
        },
        indigo: {
            badge: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
            zoomText: "text-indigo-400 hover:text-indigo-300",
            zoomBadge: "border-indigo-500/40 text-indigo-400",
            button: "bg-indigo-500 hover:bg-indigo-600 text-white",
            hoverBg: "hover:bg-indigo-500"
        }
    };

    const theme = colorClasses[accentColor] || colorClasses.amber;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="relative w-full max-w-5xl bg-neutral-900/95 border border-border/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[94vh]">
                {/* Header Lightbox */}
                <div className="p-3 sm:p-4 sm:px-6 border-b border-border/50 flex items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        {item.pageNumber && (
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 ${theme.badge}`}>
                                Hal {item.pageNumber}{item.totalPages ? ` dari ${item.totalPages}` : ""}
                            </span>
                        )}
                        <span className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-36 sm:max-w-xs md:max-w-md">
                            {item.title}
                        </span>
                        {item.width && item.height && (
                            <span className="text-xs text-foreground/50 hidden md:inline shrink-0">
                                ({item.width} × {item.height} px
                                {item.size ? ` • ${(item.size / 1024).toFixed(0)} KB` : ""})
                            </span>
                        )}
                    </div>

                    {/* Toolbar Kontrol Zoom, Unduh & Tutup */}
                    <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                        {/* Toolbar Zoom */}
                        <div className="flex items-center bg-surface/80 border border-border/70 rounded-xl p-0.5 sm:p-1 shadow-inner">
                            <button
                                type="button"
                                onClick={handleZoomOut}
                                disabled={imageZoom <= 0.5}
                                className="p-1 sm:p-1.5 rounded-lg hover:bg-surface text-foreground/70 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                                title="Perkecil Zoom (-)"
                            >
                                <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>

                            <button
                                type="button"
                                onClick={handleResetZoom}
                                className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg hover:bg-surface text-[11px] sm:text-xs font-bold transition-colors cursor-pointer ${theme.zoomText}`}
                                title="Reset Zoom ke 100% (Tekan 0)"
                            >
                                {Math.round(imageZoom * 100)}%
                            </button>

                            <button
                                type="button"
                                onClick={handleZoomIn}
                                disabled={imageZoom >= 4}
                                className="p-1 sm:p-1.5 rounded-lg hover:bg-surface text-foreground/70 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                                title="Perbesar Zoom (+)"
                            >
                                <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                        </div>

                        {/* Optional Single Download Button */}
                        {onDownload && (
                            <button
                                type="button"
                                onClick={onDownload}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                                title="Unduh item ini"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{downloadLabel}</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 sm:p-2 rounded-xl bg-surface/80 hover:bg-surface text-foreground/60 hover:text-foreground border border-border/60 transition-colors cursor-pointer shrink-0"
                            title="Tutup (Esc)"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Body Lightbox (Foto Besar, Zoom, Pan & Sudut Persegi 90 Derajat rounded-none) */}
                <div
                    ref={lightboxBodyRef}
                    className="flex-1 overflow-hidden p-2 sm:p-6 flex items-center justify-center bg-black/75 relative select-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div
                        className="transition-transform duration-100 ease-out origin-center flex items-center justify-center will-change-transform"
                        style={{
                            transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${imageZoom})`,
                            cursor: imageZoom > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
                        }}
                        onDoubleClick={handleToggleZoom}
                        title={
                            imageZoom > 1
                                ? "Tahan & geser untuk melihat area lain, klik ganda untuk reset"
                                : "Klik ganda untuk memperbesar (2x)"
                        }
                    >
                        <img
                            src={item.url}
                            alt={item.title}
                            className="max-h-[72vh] w-auto max-w-full object-contain rounded-none shadow-2xl pointer-events-none"
                            draggable={false}
                        />
                    </div>

                    {/* Floating Reset Zoom Badge saat di-zoom */}
                    {imageZoom !== 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/90 backdrop-blur-md border text-white text-xs shadow-2xl animate-fade-in border-border/80">
                            <span className="font-medium text-foreground/90">Zoom: {Math.round(imageZoom * 100)}%</span>
                            <button
                                type="button"
                                onClick={handleResetZoom}
                                className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${theme.button}`}
                                title="Kembalikan ke ukuran normal"
                            >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reset</span>
                            </button>
                        </div>
                    )}

                    {/* Navigasi Panah Kiri */}
                    {hasPrev && onNavigatePrev && (
                        <button
                            type="button"
                            onClick={onNavigatePrev}
                            className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-black/75 text-white border border-white/20 transition-all hover:scale-110 shadow-xl cursor-pointer ${theme.hoverBg}`}
                            title="Halaman Sebelumnya (Panah Kiri)"
                        >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    )}

                    {/* Navigasi Panah Kanan */}
                    {hasNext && onNavigateNext && (
                        <button
                            type="button"
                            onClick={onNavigateNext}
                            className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-black/75 text-white border border-white/20 transition-all hover:scale-110 shadow-xl cursor-pointer ${theme.hoverBg}`}
                            title="Halaman Berikutnya (Panah Kanan)"
                        >
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    )}
                </div>

                {/* Footer Lightbox */}
                <div className="p-2.5 sm:p-3 sm:px-6 border-t border-border/50 bg-surface/50 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs text-foreground/60">
                    <span className="hidden sm:inline">
                        Tips: Scroll mouse / klik ganda untuk zoom • Geser untuk navigasi • ⬅ ➡ untuk ganti halaman • Esc untuk keluar
                    </span>
                    <span className="sm:hidden text-[11px]">Ketuk 2x untuk zoom • Geser untuk memindahkan</span>
                    {item.aspectRatio && (
                        <span className="text-[11px] sm:text-xs">Rasio: {item.aspectRatio}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
