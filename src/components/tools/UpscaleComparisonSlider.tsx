"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Image as ImageIcon, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface UpscaleComparisonSliderProps {
    originalUrl: string;
    resultUrl: string;
    originalWidth: number;
    originalHeight: number;
    resultWidth: number;
    resultHeight: number;
    originalSize?: string;
    resultSize?: string;
    altText?: string;
    className?: string;
}

export default function UpscaleComparisonSlider({
    originalUrl,
    resultUrl,
    originalWidth,
    originalHeight,
    resultWidth,
    resultHeight,
    originalSize,
    resultSize,
    altText = "Perbandingan Tingkatkan Resolusi",
    className = ""
}: UpscaleComparisonSliderProps) {
    const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [zoomLevel, setZoomLevel] = useState<number>(1); // 1x, 2x, 3x
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = useCallback((clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPos(pos);
    }, []);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isDragging) return;
        handleMove(e.touches[0].clientX);
    }, [isDragging, handleMove]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        handleMove(e.clientX);
    }, [isDragging, handleMove]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
            window.addEventListener("touchmove", handleTouchMove, { passive: true });
            window.addEventListener("touchend", handleMouseUp);
        } else {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

    const toggleZoom = () => {
        setZoomLevel((prev) => (prev === 1 ? 2 : prev === 2 ? 3 : 1));
    };

    return (
        <div className="space-y-3">
            {/* Top Toolbar: Resolution Badges & Zoom Control */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Badge Asli */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface/80 border border-border/70 text-foreground/70">
                        <ImageIcon size={12} className="text-foreground/50 shrink-0" />
                        <span>Asli: <strong className="text-foreground">{originalWidth}×{originalHeight}</strong> {originalSize ? `(${originalSize})` : ""}</span>
                    </span>

                    <span className="text-foreground/30 font-bold">→</span>

                    {/* Badge Hasil Upscale */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-medium shadow-xs">
                        <Sparkles size={12} className="text-emerald-400 shrink-0 animate-pulse" />
                        <span>Hasil: <strong className="text-emerald-300 font-bold">{resultWidth}×{resultHeight}</strong> {resultSize ? `(${resultSize})` : ""}</span>
                    </span>
                </div>

                {/* Tombol Zoom Detail */}
                <button
                    type="button"
                    onClick={toggleZoom}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface/80 hover:bg-surface border border-border/70 text-foreground/80 hover:text-foreground text-xs font-semibold transition-all active:scale-95 shadow-xs cursor-pointer"
                    title="Perbesar untuk melihat detail piksel halus"
                >
                    {zoomLevel === 1 ? (
                        <>
                            <ZoomIn size={13} className="text-primary" />
                            <span>Zoom 2×</span>
                        </>
                    ) : zoomLevel === 2 ? (
                        <>
                            <ZoomIn size={13} className="text-emerald-400" />
                            <span>Zoom 3×</span>
                        </>
                    ) : (
                        <>
                            <RotateCcw size={13} className="text-amber-400" />
                            <span>Reset Zoom</span>
                        </>
                    )}
                </button>
            </div>

            {/* Interactive Comparison Viewport */}
            <div
                ref={containerRef}
                className={`relative select-none overflow-hidden rounded-2xl border border-border/80 bg-black/40 shadow-2xl ${className}`}
                style={{ touchAction: "none" }}
                onMouseDown={(e) => {
                    setIsDragging(true);
                    handleMove(e.clientX);
                }}
                onTouchStart={(e) => {
                    setIsDragging(true);
                    handleMove(e.touches[0].clientX);
                }}
            >
                {/* Checkerboard Pattern Base for PNGs */}
                <div
                    className="absolute inset-0 w-full h-full"
                    style={{
                        backgroundImage: "repeating-conic-gradient(#1e1e1e 0% 25%, #141414 0% 50%) 50% / 20px 20px"
                    }}
                />

                {/* Container Image Wrapper for Synchronized Pan / Zoom */}
                <div
                    className="relative w-full flex items-center justify-center transition-transform duration-200"
                    style={{
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: "center center"
                    }}
                >
                    {/* Layer 1: Hasil Upscale HD (Full Width Base) */}
                    <img
                        src={resultUrl}
                        alt={`${altText} - Sesudah (Upscaled)`}
                        className="w-full h-auto max-h-75 sm:max-h-110 lg:max-h-135 object-contain block relative z-10 pointer-events-none"
                    />

                    {/* Layer 2: Gambar Asli Sebelum (Clipped) */}
                    <div
                        className="absolute inset-0 z-20 overflow-hidden pointer-events-none"
                        style={{
                            clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`
                        }}
                    >
                        <img
                            src={originalUrl}
                            alt={`${altText} - Sebelum (Asli)`}
                            className="w-full h-full object-contain block"
                        />
                    </div>
                </div>

                {/* Floating Tags (Sebelum / Sesudah) */}
                <div className="absolute top-3 left-3 z-30 pointer-events-none">
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-black/70 backdrop-blur-md text-white/80 border border-white/20 shadow-md">
                        Sebelum (Asli)
                    </span>
                </div>
                <div className="absolute top-3 right-3 z-30 pointer-events-none">
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-500/80 backdrop-blur-md text-white border border-emerald-400/40 shadow-md">
                        Sesudah (Upscaled)
                    </span>
                </div>

                {/* Vertical Divider Line with Grab Handle */}
                <div
                    className="absolute top-0 bottom-0 z-30 w-1 bg-white shadow-[0_0_12px_rgba(255,255,255,0.7)] pointer-events-none"
                    style={{ left: `calc(${sliderPos}% - 0.5px)` }}
                >
                    <div
                        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-xl cursor-ew-resize pointer-events-auto transition-transform ${
                            isDragging ? "scale-115 ring-4 ring-primary/40" : "hover:scale-105"
                        }`}
                        title="Geser untuk membandingkan"
                    >
                        <div className="flex items-center gap-0.5 text-slate-800 text-[10px] font-black">
                            <span>◀</span>
                            <span>▶</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Helper Text below slider */}
            <p className="text-center text-[11px] text-foreground/50">
                Geser lingkaran putih di tengah untuk melihat perbandingan ketajaman sebelum dan sesudah.
            </p>
        </div>
    );
}
