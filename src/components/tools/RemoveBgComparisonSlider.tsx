"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Image as ImageIcon } from "lucide-react";

interface RemoveBgComparisonSliderProps {
    originalUrl: string;
    resultUrl: string;
    altText?: string;
    backdropColor?: string; // "transparent" or hex like "#FFFFFF", "#DC2626", etc.
    className?: string;
}

export default function RemoveBgComparisonSlider({
    originalUrl,
    resultUrl,
    altText = "Perbandingan Hapus Latar",
    backdropColor = "transparent",
    className = ""
}: RemoveBgComparisonSliderProps) {
    const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100
    const [isDragging, setIsDragging] = useState<boolean>(false);
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

    // Checkerboard style for transparency
    const isTransparent = !backdropColor || backdropColor === "transparent";

    return (
        <div
            ref={containerRef}
            className={`relative select-none overflow-hidden rounded-2xl border border-border/80 shadow-2xl ${className}`}
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
            {/* Layer 1: Background Result (Transparan atau Latar Warna) */}
            <div
                className="absolute inset-0 w-full h-full"
                style={{
                    backgroundColor: isTransparent ? "transparent" : backdropColor,
                    backgroundImage: isTransparent
                        ? "repeating-conic-gradient(#262626 0% 25%, #171717 0% 50%) 50% / 20px 20px"
                        : "none"
                }}
            />

            {/* Layer 2: Result Cutout Image (Full View) */}
            <img
                src={resultUrl}
                alt={`${altText} - Sesudah`}
                className="w-full h-auto max-h-137.5 object-contain block relative z-10 pointer-events-none rounded-none"
            />

            {/* Layer 3: Original Image Overlaid (Clipped to slider position) */}
            <div
                className="absolute inset-0 overflow-hidden z-20 pointer-events-none"
                style={{
                    clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`
                }}
            >
                <div className="absolute inset-0 bg-neutral-900" />
                <img
                    src={originalUrl}
                    alt={`${altText} - Sebelum`}
                    className="w-full h-auto max-h-137.5 object-contain block relative z-10 rounded-none"
                />

                {/* Badge Label "Asli" */}
                <div className="absolute top-4 left-4 z-30 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-bold tracking-wider uppercase text-white flex items-center gap-1.5 shadow-lg">
                    <ImageIcon className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Foto Asli</span>
                </div>
            </div>

            {/* Badge Label "Hasil Cutout" */}
            <div className="absolute top-4 right-4 z-30 px-3 py-1 rounded-full bg-emerald-500/80 backdrop-blur-md border border-emerald-400/40 text-[11px] font-bold tracking-wider uppercase text-white flex items-center gap-1.5 shadow-lg pointer-events-none">
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span>Tanpa Latar (HD)</span>
            </div>

            {/* Layer 4: Vertical Slider Line and Draggable Handle */}
            <div
                className="absolute top-0 bottom-0 z-40 flex items-center justify-center cursor-ew-resize group"
                style={{
                    left: `${sliderPos}%`,
                    transform: "translateX(-50%)"
                }}
            >
                {/* Thin divider line */}
                <div className="w-0.5 h-full bg-white shadow-[0_0_8px_rgba(0,0,0,0.8)]" />

                {/* Draggable Circle Knob */}
                <div className="absolute w-10 h-10 -ml-px rounded-full bg-white/95 backdrop-blur-md shadow-2xl border-2 border-emerald-500 flex items-center justify-center text-emerald-700 transition-transform group-hover:scale-110 active:scale-95">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M8.5 7l-5 5 5 5V7zm7 0v10l5-5-5-5z" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
