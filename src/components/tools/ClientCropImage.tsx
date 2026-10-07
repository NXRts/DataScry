"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Dropzone from "@/components/ui/Dropzone";
import {
    Crop,
    Download,
    RotateCw,
    RotateCcw,
    FlipHorizontal,
    FlipVertical,
    Sparkles,
    CheckCircle2,
    ZoomIn,
    ZoomOut,
    Sliders,
    ImageIcon,
    FileText,
    ArrowRight,
    Lock,
    Unlock,
    Info,
    Check,
    RotateCcw as ResetIcon,
    AlertCircle,
    Maximize2,
    Grid3X3
} from "lucide-react";
import MediaLightboxModal, { LightboxItem } from "@/components/shared/MediaLightboxModal";

// Preset Rasio Aspek
interface AspectRatioPreset {
    id: string;
    label: string;
    ratio: number | null; // width / height or null for free
    badge?: string;
    description?: string;
    defaultTarget?: { width: number; height: number };
}

const RATIO_PRESETS: AspectRatioPreset[] = [
    { id: "free", label: "Bebas", ratio: null, description: "Bebas atur ukuran tanpa batasan rasio" },
    {
        id: "pas-foto-3x4",
        label: "Pas Foto 3×4",
        ratio: 3 / 4,
        badge: "Resmi",
        description: "Standar Buku Nikah, Ijazah & CPNS",
        defaultTarget: { width: 354, height: 472 }
    },
    {
        id: "pas-foto-4x6",
        label: "Pas Foto 4×6",
        ratio: 4 / 6,
        badge: "Resmi",
        description: "Standar Paspor, Visa & BUMN",
        defaultTarget: { width: 472, height: 709 }
    },
    {
        id: "pas-foto-2x3",
        label: "Pas Foto 2×3",
        ratio: 2 / 3,
        badge: "Resmi",
        description: "Standar KTA & Dokumen Khusus",
        defaultTarget: { width: 236, height: 354 }
    },
    { id: "1:1", label: "1:1 Persegi", ratio: 1, description: "Avatar, LinkedIn & Profil Medsos" },
    { id: "16:9", label: "16:9 Lanskap", ratio: 16 / 9, description: "YouTube Thumbnail & Presentasi" },
    { id: "9:16", label: "9:16 Potret", ratio: 9 / 16, description: "Instagram Story, Reels & TikTok" },
    { id: "4:3", label: "4:3 Standar", ratio: 4 / 3, description: "Format Foto Klasik" }
];

export interface CropRect {
    x: number; // 0..1 normalized
    y: number; // 0..1 normalized
    w: number; // 0..1 normalized
    h: number; // 0..1 normalized
}

type DragHandle =
    | "move"
    | "nw"
    | "ne"
    | "se"
    | "sw"
    | "n"
    | "s"
    | "e"
    | "w"
    | null;

export default function ClientCropImage() {
    const [file, setFile] = useState<File | null>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

    // Transform state
    const [selectedPresetId, setSelectedPresetId] = useState<string>("pas-foto-3x4");
    const [cropRect, setCropRect] = useState<CropRect>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
    const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
    const [flipH, setFlipH] = useState<boolean>(false);
    const [flipV, setFlipV] = useState<boolean>(false);
    const [showGrid, setShowGrid] = useState<boolean>(true);

    // Target resize dimension state
    const [isCustomResize, setIsCustomResize] = useState<boolean>(false);
    const [targetWidth, setTargetWidth] = useState<number>(354);
    const [targetHeight, setTargetHeight] = useState<number>(472);
    const [lockTargetRatio, setLockTargetRatio] = useState<boolean>(true);

    // Export options
    const [outputFormat, setOutputFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/jpeg");
    const [outputQuality, setOutputQuality] = useState<number>(0.92);

    // Interactive Dragging
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [activeHandle, setActiveHandle] = useState<DragHandle>(null);
    const dragStartRef = useRef<{ clientX: number; clientY: number; initialCrop: CropRect } | null>(null);

    // Processing & Output
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [resultFileName, setResultFileName] = useState<string>("");
    const [resultDimensions, setResultDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Container Refs
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    // Active ratio
    const currentPreset = RATIO_PRESETS.find((p) => p.id === selectedPresetId) || RATIO_PRESETS[0];

    // Initialize crop box fitting the aspect ratio
    const applyAspectRatioToCrop = useCallback(
        (ratio: number | null, natW: number, natH: number) => {
            if (!ratio || natW <= 0 || natH <= 0) {
                // Freeform: default 80% center
                setCropRect({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
                return;
            }

            const imgRatio = natW / natH;
            let w = 0.8;
            let h = 0.8;

            if (ratio > imgRatio) {
                // Target lebih lebar dari gambar
                w = 0.85;
                h = (w * natW) / (ratio * natH);
                if (h > 0.9) {
                    h = 0.9;
                    w = (h * natH * ratio) / natW;
                }
            } else {
                // Target lebih tinggi (seperti pas foto 3:4 atau 2:3)
                h = 0.85;
                w = (h * natH * ratio) / natW;
                if (w > 0.9) {
                    w = 0.9;
                    h = (w * natW) / (ratio * natH);
                }
            }

            const x = Math.max(0, (1 - w) / 2);
            const y = Math.max(0, (1 - h) / 2);

            setCropRect({ x, y, w, h });
        },
        []
    );

    // Handle File Selection
    const handleFileSelect = (files: File[]) => {
        if (!files || files.length === 0) return;
        const selected = files[0];

        if (!selected.type.startsWith("image/")) {
            setErrorMessage("Harap pilih berkas gambar yang valid (JPG, PNG, WebP, dll).");
            return;
        }

        setFile(selected);
        setErrorMessage(null);
        setResultBlob(null);
        setResultUrl(null);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);

        const url = URL.createObjectURL(selected);
        setImageSrc(url);

        const img = new Image();
        img.onload = () => {
            setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });

            // Apply default preset (Pas Foto 3x4)
            const preset = RATIO_PRESETS.find((p) => p.id === selectedPresetId) || RATIO_PRESETS[1];
            applyAspectRatioToCrop(preset.ratio, img.naturalWidth, img.naturalHeight);

            if (preset.defaultTarget) {
                setTargetWidth(preset.defaultTarget.width);
                setTargetHeight(preset.defaultTarget.height);
            } else {
                setTargetWidth(Math.round(img.naturalWidth * 0.8));
                setTargetHeight(Math.round(img.naturalHeight * 0.8));
            }
        };
        img.src = url;
    };

    // Change Preset
    const handlePresetChange = (presetId: string) => {
        setSelectedPresetId(presetId);
        const preset = RATIO_PRESETS.find((p) => p.id === presetId);
        if (!preset) return;

        if (naturalSize.width > 0 && naturalSize.height > 0) {
            applyAspectRatioToCrop(preset.ratio, naturalSize.width, naturalSize.height);
        }

        if (preset.defaultTarget) {
            setTargetWidth(preset.defaultTarget.width);
            setTargetHeight(preset.defaultTarget.height);
        } else if (preset.ratio && naturalSize.width > 0) {
            const currentCroppedW = Math.round(cropRect.w * naturalSize.width);
            setTargetWidth(currentCroppedW);
            setTargetHeight(Math.round(currentCroppedW / preset.ratio));
        }
    };

    // Pointer Event Handlers for Dragging and Resizing
    const handlePointerDown = (handle: DragHandle, e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsDragging(true);
        setActiveHandle(handle);
        dragStartRef.current = {
            clientX: e.clientX,
            clientY: e.clientY,
            initialCrop: { ...cropRect }
        };

        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !activeHandle || !dragStartRef.current || !imageContainerRef.current) return;

        const rect = imageContainerRef.current.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const dx = (e.clientX - dragStartRef.current.clientX) / rect.width;
        const dy = (e.clientY - dragStartRef.current.clientY) / rect.height;
        const initial = dragStartRef.current.initialCrop;

        let nextCrop = { ...initial };
        const ratio = currentPreset.ratio;

        if (activeHandle === "move") {
            let nextX = initial.x + dx;
            let nextY = initial.y + dy;

            nextX = Math.max(0, Math.min(nextX, 1 - initial.w));
            nextY = Math.max(0, Math.min(nextY, 1 - initial.h));

            nextCrop.x = nextX;
            nextCrop.y = nextY;
        } else {
            // Resizing via handles
            let nextW = initial.w;
            let nextH = initial.h;
            let nextX = initial.x;
            let nextY = initial.y;

            if (activeHandle.includes("e")) {
                nextW = Math.max(0.08, Math.min(initial.w + dx, 1 - initial.x));
            }
            if (activeHandle.includes("s")) {
                nextH = Math.max(0.08, Math.min(initial.h + dy, 1 - initial.y));
            }
            if (activeHandle.includes("w")) {
                const maxDx = initial.x + initial.w - 0.08;
                const appliedDx = Math.min(Math.max(-initial.x, dx), maxDx);
                nextX = initial.x + appliedDx;
                nextW = initial.w - appliedDx;
            }
            if (activeHandle.includes("n")) {
                const maxDy = initial.y + initial.h - 0.08;
                const appliedDy = Math.min(Math.max(-initial.y, dy), maxDy);
                nextY = initial.y + appliedDy;
                nextH = initial.h - appliedDy;
            }

            // Lock aspect ratio constraint if active preset has a fixed ratio
            if (ratio && naturalSize.width > 0 && naturalSize.height > 0) {
                // w_px / h_px = ratio => (nextW * natW) / (nextH * natH) = ratio
                if (activeHandle === "e" || activeHandle === "w" || activeHandle === "se" || activeHandle === "ne") {
                    nextH = (nextW * naturalSize.width) / (ratio * naturalSize.height);
                    if (nextY + nextH > 1) {
                        nextH = 1 - nextY;
                        nextW = (nextH * naturalSize.height * ratio) / naturalSize.width;
                    }
                } else if (activeHandle === "s" || activeHandle === "n" || activeHandle === "sw" || activeHandle === "nw") {
                    nextW = (nextH * naturalSize.height * ratio) / naturalSize.width;
                    if (nextX + nextW > 1) {
                        nextW = 1 - nextX;
                        nextH = (nextW * naturalSize.width) / (ratio * naturalSize.height);
                    }
                }
            }

            nextCrop.x = Math.max(0, Math.min(nextX, 1 - 0.08));
            nextCrop.y = Math.max(0, Math.min(nextY, 1 - 0.08));
            nextCrop.w = Math.max(0.08, Math.min(nextW, 1 - nextCrop.x));
            nextCrop.h = Math.max(0.08, Math.min(nextH, 1 - nextCrop.y));
        }

        setCropRect(nextCrop);
    };

    const handlePointerUp = () => {
        setIsDragging(false);
        setActiveHandle(null);
        dragStartRef.current = null;
    };

    // Calculate Cropped Pixels in Natural Image Units
    const croppedPixelWidth = Math.round(cropRect.w * naturalSize.width);
    const croppedPixelHeight = Math.round(cropRect.h * naturalSize.height);

    // Rotation handlers
    const rotateClockwise = () => setRotation((prev) => (prev + 90) % 360);
    const rotateCounterClockwise = () => setRotation((prev) => (prev + 270) % 360);

    // Execution: Crop and Resize using Canvas API
    const executeCropAndResize = async () => {
        if (!imageSrc || naturalSize.width <= 0 || naturalSize.height <= 0) return;

        setIsProcessing(true);
        setErrorMessage(null);

        try {
            const img = new Image();
            img.crossOrigin = "anonymous";

            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = (e) => reject(e);
                img.src = imageSrc;
            });

            // 1. Calculate Crop Box Source Pixels
            const srcX = cropRect.x * naturalSize.width;
            const srcY = cropRect.y * naturalSize.height;
            const srcW = cropRect.w * naturalSize.width;
            const srcH = cropRect.h * naturalSize.height;

            // 2. Offscreen intermediate canvas for cropped source
            const intermediateCanvas = document.createElement("canvas");
            intermediateCanvas.width = srcW;
            intermediateCanvas.height = srcH;
            const iCtx = intermediateCanvas.getContext("2d");
            if (!iCtx) throw new Error("Gagal menginisialisasi kanvas");

            iCtx.imageSmoothingEnabled = true;
            iCtx.imageSmoothingQuality = "high";
            iCtx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

            // 3. Final Canvas considering Rotation, Flip & Custom Resize
            const finalW = isCustomResize && targetWidth > 0 ? targetWidth : srcW;
            const finalH = isCustomResize && targetHeight > 0 ? targetHeight : srcH;

            // If rotation is 90 or 270 deg, canvas dimensions are swapped
            const isRotatedSideways = rotation === 90 || rotation === 270;
            const outCanvasW = isRotatedSideways ? finalH : finalW;
            const outCanvasH = isRotatedSideways ? finalW : finalH;

            const finalCanvas = document.createElement("canvas");
            finalCanvas.width = outCanvasW;
            finalCanvas.height = outCanvasH;
            const fCtx = finalCanvas.getContext("2d");
            if (!fCtx) throw new Error("Gagal menginisialisasi kanvas final");

            fCtx.imageSmoothingEnabled = true;
            fCtx.imageSmoothingQuality = "high";

            // If output is JPEG, fill white background to prevent black transparent areas
            if (outputFormat === "image/jpeg") {
                fCtx.fillStyle = "#ffffff";
                fCtx.fillRect(0, 0, outCanvasW, outCanvasH);
            }

            // Apply transformations
            fCtx.save();
            fCtx.translate(outCanvasW / 2, outCanvasH / 2);
            fCtx.rotate((rotation * Math.PI) / 180);
            fCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

            // Draw intermediate cropped image scaled to final size
            fCtx.drawImage(
                intermediateCanvas,
                -finalW / 2,
                -finalH / 2,
                finalW,
                finalH
            );
            fCtx.restore();

            // 4. Export Blob
            const blob = await new Promise<Blob>((resolve, reject) => {
                finalCanvas.toBlob(
                    (b) => (b ? resolve(b) : reject(new Error("Gagal mengekspor kanvas"))),
                    outputFormat,
                    outputQuality
                );
            });

            const blobUrl = URL.createObjectURL(blob);
            const ext = outputFormat === "image/png" ? "png" : outputFormat === "image/webp" ? "webp" : "jpg";
            const baseName = file ? file.name.replace(/\.[^/.]+$/, "") : "foto";
            const newName = `${baseName}-cropped.${ext}`;

            setResultBlob(blob);
            setResultUrl(blobUrl);
            setResultFileName(newName);
            setResultDimensions({ width: outCanvasW, height: outCanvasH });
        } catch (err: unknown) {
            console.error("Gagal melakukan crop foto:", err);
            setErrorMessage("Gagal memproses gambar. Pastikan format gambar didukung oleh browser Anda.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Download Result
    const handleDownload = () => {
        if (!resultBlob || !resultUrl) return;
        const a = document.createElement("a");
        a.href = resultUrl;
        a.download = resultFileName || "foto-cropped.jpg";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Reset All State
    const handleReset = () => {
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        if (imageSrc) URL.revokeObjectURL(imageSrc);
        setFile(null);
        setImageSrc(null);
        setNaturalSize({ width: 0, height: 0 });
        setResultBlob(null);
        setResultUrl(null);
        setErrorMessage(null);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setIsCustomResize(false);
    };

    return (
        <div className="space-y-8">
            {/* Error Banner */}
            {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm font-medium">{errorMessage}</div>
                    <button
                        onClick={() => setErrorMessage(null)}
                        className="text-foreground/40 hover:text-foreground text-xs"
                    >
                        Tutup
                    </button>
                </div>
            )}

            {/* Step 1: Upload State */}
            {!imageSrc && (
                <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-border/80 space-y-6">
                    <div className="text-center max-w-xl mx-auto space-y-2">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                            <Crop className="w-7 h-7" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                            Pilih Foto yang Ingin Dipotong & Diubah Ukurannya
                        </h2>
                        <p className="text-foreground/60 text-sm">
                            Potong pas foto resmi 2×3, 3×4, 4×6 cm untuk CPNS/BUMN, avatar profil, atau ubah resolusi piksel presisi secara 100% lokal.
                        </p>
                    </div>

                    <Dropzone
                        onFilesAccepted={handleFileSelect}
                        accept="image/*"
                        title="Tarik & Lepas Foto ke Sini"
                        description="Mendukung format JPG, PNG, WebP, dan format foto digital lainnya."
                    />

                    {/* Quick Highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div className="p-4 rounded-2xl bg-surface/50 border border-border/50 text-center space-y-1">
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                Preset Pas Foto Resmi
                            </span>
                            <p className="text-xs text-foreground/60">
                                Ukuran 2×3, 3×4, dan 4×6 cm dengan rasio presisi standar dokumen negara.
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-surface/50 border border-border/50 text-center space-y-1">
                            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                                Atur Resolusi Piksel
                            </span>
                            <p className="text-xs text-foreground/60">
                                Kunci atau sesuaikan dimensi piksel (Width × Height) sesuai syarat portal.
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-surface/50 border border-border/50 text-center space-y-1">
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                                100% Privasi Terjamin
                            </span>
                            <p className="text-xs text-foreground/60">
                                Foto Anda diproses menggunakan Canvas browser tanpa pernah dikirim ke internet.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Interactive Cropper State */}
            {imageSrc && !resultBlob && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Interactive Canvas Viewport (8 Cols) */}
                    <div className="lg:col-span-8 space-y-4">
                        {/* Editor Header Toolbar */}
                        <div className="glass-panel p-4 rounded-2xl border border-border/80 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <ImageIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-xs sm:text-sm text-foreground truncate max-w-44 sm:max-w-xs" title={file?.name}>
                                        {file?.name}
                                    </h4>
                                    <p className="text-[11px] text-foreground/50">
                                        Asli: {naturalSize.width} × {naturalSize.height} px
                                    </p>
                                </div>
                            </div>

                            {/* Rotation & Flip Controls */}
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={rotateCounterClockwise}
                                    className="p-2 rounded-xl bg-surface/80 hover:bg-surface border border-border/60 text-foreground/70 hover:text-foreground transition-colors"
                                    title="Putar 90° Berlawanan Arah Jarum Jam"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={rotateClockwise}
                                    className="p-2 rounded-xl bg-surface/80 hover:bg-surface border border-border/60 text-foreground/70 hover:text-foreground transition-colors"
                                    title="Putar 90° Searah Jarum Jam"
                                >
                                    <RotateCw className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setFlipH((prev) => !prev)}
                                    className={`p-2 rounded-xl border transition-colors ${
                                        flipH
                                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                            : "bg-surface/80 hover:bg-surface border border-border/60 text-foreground/70"
                                    }`}
                                    title="Balik Horizontal (Mirror)"
                                >
                                    <FlipHorizontal className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setFlipV((prev) => !prev)}
                                    className={`p-2 rounded-xl border transition-colors ${
                                        flipV
                                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                            : "bg-surface/80 hover:bg-surface border border-border/60 text-foreground/70"
                                    }`}
                                    title="Balik Vertikal"
                                >
                                    <FlipVertical className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setShowGrid((prev) => !prev)}
                                    className={`p-2 rounded-xl border transition-colors ${
                                        showGrid
                                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                            : "bg-surface/80 hover:bg-surface border border-border/60 text-foreground/70"
                                    }`}
                                    title="Tampilkan / Sembunyikan Grid Rule of Thirds"
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="p-2 rounded-xl bg-surface/80 hover:bg-surface border border-border/60 text-foreground/50 hover:text-foreground transition-colors ml-1"
                                    title="Ganti Foto"
                                >
                                    <ResetIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Visual Interactive Viewport */}
                        <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-border/80 flex items-center justify-center bg-black/40 min-h-110 overflow-hidden select-none">
                            <div
                                ref={imageContainerRef}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerUp}
                                className="relative max-w-full max-h-125 flex items-center justify-center overflow-hidden touch-none rounded-xl border border-border/50"
                            >
                                {/* Base Image */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    ref={imageRef}
                                    src={imageSrc}
                                    alt="Foto yang akan dipotong"
                                    style={{
                                        transform: `rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`,
                                        transition: "transform 0.15s ease-out"
                                    }}
                                    className="max-w-full max-h-125 object-contain pointer-events-none block"
                                    draggable={false}
                                />

                                {/* Dark Mask Layer Outside Crop Box */}
                                <div className="absolute inset-0 pointer-events-none">
                                    {/* Top */}
                                    <div
                                        style={{ height: `${cropRect.y * 100}%` }}
                                        className="absolute top-0 left-0 right-0 bg-black/60"
                                    />
                                    {/* Bottom */}
                                    <div
                                        style={{ top: `${(cropRect.y + cropRect.h) * 100}%`, bottom: 0 }}
                                        className="absolute left-0 right-0 bg-black/60"
                                    />
                                    {/* Left */}
                                    <div
                                        style={{
                                            top: `${cropRect.y * 100}%`,
                                            height: `${cropRect.h * 100}%`,
                                            width: `${cropRect.x * 100}%`
                                        }}
                                        className="absolute left-0 bg-black/60"
                                    />
                                    {/* Right */}
                                    <div
                                        style={{
                                            top: `${cropRect.y * 100}%`,
                                            height: `${cropRect.h * 100}%`,
                                            left: `${(cropRect.x + cropRect.w) * 100}%`,
                                            right: 0
                                        }}
                                        className="absolute bg-black/60"
                                    />
                                </div>

                                {/* Interactive Crop Selection Box */}
                                <div
                                    style={{
                                        left: `${cropRect.x * 100}%`,
                                        top: `${cropRect.y * 100}%`,
                                        width: `${cropRect.w * 100}%`,
                                        height: `${cropRect.h * 100}%`
                                    }}
                                    onPointerDown={(e) => handlePointerDown("move", e)}
                                    className="absolute border-2 border-emerald-400 shadow-2xl cursor-move touch-none z-10 group"
                                >
                                    {/* Rule of Thirds Grid Lines */}
                                    {showGrid && (
                                        <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-40">
                                            <div className="border-r border-b border-emerald-300" />
                                            <div className="border-r border-b border-emerald-300" />
                                            <div className="border-b border-emerald-300" />
                                            <div className="border-r border-b border-emerald-300" />
                                            <div className="border-r border-b border-emerald-300" />
                                            <div className="border-b border-emerald-300" />
                                            <div className="border-r border-emerald-300" />
                                            <div className="border-r border-emerald-300" />
                                            <div />
                                        </div>
                                    )}

                                    {/* Live Pixel Dimension Badge */}
                                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-[10px] font-mono text-emerald-300 border border-emerald-400/40 pointer-events-none z-20">
                                        {croppedPixelWidth} × {croppedPixelHeight} px
                                    </div>

                                    {/* 8 Resize Handles */}
                                    {/* Corners */}
                                    <div
                                        onPointerDown={(e) => handlePointerDown("nw", e)}
                                        className="absolute -top-2 -left-2 w-4 h-4 bg-emerald-400 border-2 border-zinc-950 rounded-xs cursor-nwse-resize z-20 shadow-md"
                                    />
                                    <div
                                        onPointerDown={(e) => handlePointerDown("ne", e)}
                                        className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-400 border-2 border-zinc-950 rounded-xs cursor-nesw-resize z-20 shadow-md"
                                    />
                                    <div
                                        onPointerDown={(e) => handlePointerDown("se", e)}
                                        className="absolute -bottom-2 -right-2 w-4 h-4 bg-emerald-400 border-2 border-zinc-950 rounded-xs cursor-nwse-resize z-20 shadow-md"
                                    />
                                    <div
                                        onPointerDown={(e) => handlePointerDown("sw", e)}
                                        className="absolute -bottom-2 -left-2 w-4 h-4 bg-emerald-400 border-2 border-zinc-950 rounded-xs cursor-nesw-resize z-20 shadow-md"
                                    />

                                    {/* Edges */}
                                    <div
                                        onPointerDown={(e) => handlePointerDown("n", e)}
                                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-emerald-400 border border-zinc-950 rounded-xs cursor-ns-resize z-20"
                                    />
                                    <div
                                        onPointerDown={(e) => handlePointerDown("s", e)}
                                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-emerald-400 border border-zinc-950 rounded-xs cursor-ns-resize z-20"
                                    />
                                    <div
                                        onPointerDown={(e) => handlePointerDown("w", e)}
                                        className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-6 bg-emerald-400 border border-zinc-950 rounded-xs cursor-ew-resize z-20"
                                    />
                                    <div
                                        onPointerDown={(e) => handlePointerDown("e", e)}
                                        className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-6 bg-emerald-400 border border-zinc-950 rounded-xs cursor-ew-resize z-20"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Settings & Presets Panel (4 Cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Aspect Ratio Presets */}
                        <div className="glass-panel p-5 rounded-3xl border border-border/80 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                    <Crop className="w-4 h-4 text-emerald-400" />
                                    Preset Rasio & Pas Foto
                                </h3>
                                <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                                    {currentPreset.label}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {RATIO_PRESETS.map((preset) => {
                                    const isSelected = selectedPresetId === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => handlePresetChange(preset.id)}
                                            className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                                                isSelected
                                                    ? "bg-emerald-500/15 border-emerald-500/60 text-foreground shadow-sm"
                                                    : "bg-surface/60 border-border/50 text-foreground/70 hover:bg-surface hover:text-foreground"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <span className="font-semibold text-xs">{preset.label}</span>
                                                {preset.badge && (
                                                    <span className="px-1.5 py-0.2 rounded-xs bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                                                        {preset.badge}
                                                    </span>
                                                )}
                                            </div>
                                            {preset.description && (
                                                <span className="text-[10px] text-foreground/50 mt-1 line-clamp-1">
                                                    {preset.description}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Custom Resize & Dimension Panel */}
                        <div className="glass-panel p-5 rounded-3xl border border-border/80 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                                        <Sliders className="w-4 h-4 text-teal-400" />
                                        Ubah Resolusi (Resize)
                                    </h4>
                                    <p className="text-[11px] text-foreground/50">
                                        Sesuaikan piksel akhir hasil potongan
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isCustomResize}
                                        onChange={(e) => setIsCustomResize(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-surface peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 border border-border/60" />
                                </label>
                            </div>

                            {isCustomResize ? (
                                <div className="space-y-3 pt-1">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs text-foreground/60 font-medium">Lebar (px)</label>
                                            <input
                                                type="number"
                                                min={50}
                                                max={8000}
                                                value={targetWidth}
                                                onChange={(e) => {
                                                    const w = parseInt(e.target.value) || 0;
                                                    setTargetWidth(w);
                                                    if (lockTargetRatio && currentPreset.ratio) {
                                                        setTargetHeight(Math.round(w / currentPreset.ratio));
                                                    }
                                                }}
                                                className="w-full px-3 py-2 rounded-xl bg-surface/80 border border-border/60 text-xs text-foreground font-mono focus:border-emerald-500 focus:outline-hidden"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-foreground/60 font-medium">Tinggi (px)</label>
                                            <input
                                                type="number"
                                                min={50}
                                                max={8000}
                                                value={targetHeight}
                                                onChange={(e) => {
                                                    const h = parseInt(e.target.value) || 0;
                                                    setTargetHeight(h);
                                                    if (lockTargetRatio && currentPreset.ratio) {
                                                        setTargetWidth(Math.round(h * currentPreset.ratio));
                                                    }
                                                }}
                                                className="w-full px-3 py-2 rounded-xl bg-surface/80 border border-border/60 text-xs text-foreground font-mono focus:border-emerald-500 focus:outline-hidden"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setLockTargetRatio((prev) => !prev)}
                                        className="text-xs text-foreground/60 hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                        {lockTargetRatio ? (
                                            <>
                                                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                                                <span>Rasio Terkunci Otomatis</span>
                                            </>
                                        ) : (
                                            <>
                                                <Unlock className="w-3.5 h-3.5 text-foreground/40" />
                                                <span>Rasio Bebas (Bisa Berubah)</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="text-xs text-foreground/60 bg-surface/40 p-3 rounded-xl border border-border/40">
                                    Menggunakan ukuran piksel murni dari hasil potongan:{" "}
                                    <span className="font-mono font-semibold text-emerald-400">
                                        {croppedPixelWidth} × {croppedPixelHeight} px
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Export Format & Quality */}
                        <div className="glass-panel p-5 rounded-3xl border border-border/80 space-y-4">
                            <h4 className="font-bold text-sm text-foreground">Format & Kualitas Ekspor</h4>

                            {/* Format Picker */}
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: "image/jpeg", label: "JPG", desc: "Ringan" },
                                    { id: "image/png", label: "PNG", desc: "Tajam" },
                                    { id: "image/webp", label: "WebP", desc: "Modern" }
                                ].map((fmt) => (
                                    <button
                                        key={fmt.id}
                                        onClick={() => setOutputFormat(fmt.id as "image/png" | "image/jpeg" | "image/webp")}
                                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                            outputFormat === fmt.id
                                                ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold"
                                                : "bg-surface/50 border-border/40 text-foreground/70 hover:bg-surface"
                                        }`}
                                    >
                                        <div className="text-xs">{fmt.label}</div>
                                        <div className="text-[10px] text-foreground/50">{fmt.desc}</div>
                                    </button>
                                ))}
                            </div>

                            {/* Quality Slider (for JPG & WebP) */}
                            {outputFormat !== "image/png" && (
                                <div className="space-y-1.5 pt-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-foreground/60">Kualitas Kompresi</span>
                                        <span className="font-mono text-emerald-400 font-semibold">
                                            {Math.round(outputQuality * 100)}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0.6}
                                        max={1.0}
                                        step={0.05}
                                        value={outputQuality}
                                        onChange={(e) => setOutputQuality(parseFloat(e.target.value))}
                                        className="w-full accent-emerald-500 cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Crop Button */}
                        <button
                            onClick={executeCropAndResize}
                            disabled={isProcessing}
                            className="w-full py-4 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Crop className="w-4 h-4" />
                            <span>Potong & Simpan Gambar</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Success & Download State */}
            {resultBlob && resultUrl && (
                <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-border/80 space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-border/60">
                        <div className="flex items-center gap-4 text-center sm:text-left">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mx-auto sm:mx-0">
                                <CheckCircle2 className="w-7 h-7" />
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-1">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Foto Berhasil Dipotong!
                                </div>
                                <h3 className="text-xl font-bold text-foreground truncate max-w-sm sm:max-w-md">
                                    {resultFileName}
                                </h3>
                                <p className="text-xs text-foreground/60 mt-0.5">
                                    Dimensi: {resultDimensions.width} × {resultDimensions.height} px • Ukuran: {(resultBlob.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={handleDownload}
                                className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Download className="w-4 h-4" />
                                <span>Unduh Foto</span>
                            </button>
                            <button
                                onClick={() => {
                                    setResultBlob(null);
                                    setResultUrl(null);
                                }}
                                className="px-4 py-3 rounded-2xl bg-surface hover:bg-surface/80 border border-border/60 text-xs font-semibold text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
                            >
                                Atur Ulang Crop
                            </button>
                            <button
                                onClick={handleReset}
                                className="p-3 rounded-2xl bg-surface hover:bg-surface/80 border border-border/60 text-foreground/70 hover:text-foreground transition-colors"
                                title="Pilih Foto Lain"
                            >
                                <ResetIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Result Preview Box */}
                    <div className="flex flex-col items-center justify-center p-6 bg-black/40 rounded-2xl border border-border/60">
                        <div className="relative group max-w-md max-h-112.5 overflow-hidden rounded-xl border border-border/80 shadow-2xl bg-zinc-950">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={resultUrl}
                                alt="Hasil potong foto"
                                className="max-w-full max-h-112.5 object-contain block mx-auto"
                            />
                            <button
                                onClick={() =>
                                    setLightboxItem({
                                        url: resultUrl,
                                        title: resultFileName,
                                        width: resultDimensions.width,
                                        height: resultDimensions.height,
                                        size: resultBlob.size,
                                        mimeType: outputFormat
                                    })
                                }
                                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-xs text-xs font-medium text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5 opacity-90 hover:opacity-100 hover:scale-105 transition-all shadow-lg cursor-pointer"
                            >
                                <ZoomIn className="w-3.5 h-3.5" />
                                <span>Inspeksi Zoom 400%</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Media Lightbox Modal */}
            <MediaLightboxModal
                isOpen={!!lightboxItem}
                item={lightboxItem}
                onClose={() => setLightboxItem(null)}
                accentColor="emerald"
            />
        </div>
    );
}
