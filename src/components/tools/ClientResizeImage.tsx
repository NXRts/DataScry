"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Dropzone from "@/components/ui/Dropzone";
import JSZip from "jszip";
import {
    Scaling,
    Download,
    CheckCircle2,
    Loader2,
    FolderArchive,
    Sliders,
    Eye,
    AlertCircle,
    X,
    RotateCcw,
    Layers,
    FileImage,
    Maximize2,
    Check,
    ZoomIn,
    Trash2,
    Lock,
    Unlock,
    Sparkles,
    Percent,
    MoveDiagonal2,
    ShieldCheck
} from "lucide-react";
import MediaLightboxModal, { LightboxItem } from "@/components/shared/MediaLightboxModal";
import {
    resizeImage,
    calculateTargetDimensions,
    ResizeMode,
    ResizeOptions
} from "@/lib/imageResizer";

interface ImageItem {
    id: string;
    file: File;
    name: string;
    size: number;
    type: string;
    url: string;
    width: number;
    height: number;
    status: "idle" | "processing" | "done" | "error";
    progress: number;
    resultBlob?: Blob;
    resultUrl?: string;
    resultWidth?: number;
    resultHeight?: number;
    resultSize?: number;
    durationMs?: number;
    error?: string;
}

const PRESET_RESOLUTIONS = [
    { label: "Full HD (1080p)", width: 1920, height: 1080, tag: "16:9" },
    { label: "HD Ready (720p)", width: 1280, height: 720, tag: "16:9" },
    { label: "Instagram Persegi", width: 1080, height: 1080, tag: "1:1" },
    { label: "Instagram Story/Reel", width: 1080, height: 1920, tag: "9:16" },
    { label: "Banner Web/Facebook", width: 1200, height: 630, tag: "1.91:1" },
    { label: "Pas Foto 4×6 (300 DPI)", width: 472, height: 709, tag: "Cetak" },
    { label: "Pas Foto 3×4 (300 DPI)", width: 354, height: 472, tag: "Cetak" },
    { label: "Pas Foto 2×3 (300 DPI)", width: 236, height: 354, tag: "Cetak" }
];

const FIT_MAX_PRESETS = [800, 1080, 1280, 1920, 2560];
const PERCENT_PRESETS = [25, 50, 75, 100, 150, 200];

const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ClientResizeImage() {
    // Images State
    const [images, setImages] = useState<ImageItem[]>([]);
    const [activeIdx, setActiveIdx] = useState<number>(0);
    const [isLoadingImages, setIsLoadingImages] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Resize Configuration State
    const [mode, setMode] = useState<ResizeMode>("percentage");
    const [percentage, setPercentage] = useState<number>(50);
    const [customWidth, setCustomWidth] = useState<number>(1280);
    const [customHeight, setCustomHeight] = useState<number>(720);
    const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
    const [maxDimension, setMaxDimension] = useState<number>(1280);

    // Output Settings
    const [outputFormat, setOutputFormat] = useState<"original" | "image/jpeg" | "image/png" | "image/webp">("original");
    const [outputQuality, setOutputQuality] = useState<number>(90); // 10 - 100

    // Processing State
    const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
    const [isZipping, setIsZipping] = useState<boolean>(false);

    // Fullscreen Lightbox
    const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

    const activeItem = images[activeIdx] || null;

    // Clean up Object URLs on unmount
    useEffect(() => {
        return () => {
            images.forEach((img) => {
                if (img.url) URL.revokeObjectURL(img.url);
                if (img.resultUrl) URL.revokeObjectURL(img.resultUrl);
            });
        };
    }, []);

    // Sync custom width/height when active image changes (if in dimensions mode)
    useEffect(() => {
        if (activeItem && images.length > 0) {
            setCustomWidth(activeItem.width);
            setCustomHeight(activeItem.height);
        }
    }, [activeIdx, activeItem?.width, activeItem?.height]);

    // Handle width change with aspect ratio lock
    const handleWidthChange = (newWidth: number) => {
        setCustomWidth(newWidth);
        if (lockAspectRatio && activeItem && activeItem.width > 0) {
            const aspect = activeItem.width / activeItem.height;
            setCustomHeight(Math.max(1, Math.round(newWidth / aspect)));
        }
    };

    // Handle height change with aspect ratio lock
    const handleHeightChange = (newHeight: number) => {
        setCustomHeight(newHeight);
        if (lockAspectRatio && activeItem && activeItem.height > 0) {
            const aspect = activeItem.width / activeItem.height;
            setCustomWidth(Math.max(1, Math.round(newHeight * aspect)));
        }
    };

    // Load dropped/uploaded images
    const handleFiles = useCallback(async (incomingFiles: File[]) => {
        setErrorMessage(null);
        setIsLoadingImages(true);

        const validFiles = incomingFiles.filter((f) =>
            f.type.startsWith("image/") || /\.(jpe?g|png|webp|bmp|gif)$/i.test(f.name)
        );

        if (validFiles.length === 0) {
            setErrorMessage("Harap unggah berkas gambar yang valid (JPG, PNG, WebP, atau BMP).");
            setIsLoadingImages(false);
            return;
        }

        const newItems: ImageItem[] = [];

        for (const file of validFiles) {
            try {
                const url = URL.createObjectURL(file);
                const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
                    img.onerror = () => reject(new Error("Gagal membaca dimensi gambar"));
                    img.src = url;
                });

                newItems.push({
                    id: Math.random().toString(36).substring(2, 9),
                    file,
                    name: file.name,
                    size: file.size,
                    type: file.type || "image/png",
                    url,
                    width: dimensions.width,
                    height: dimensions.height,
                    status: "idle",
                    progress: 0
                });
            } catch (err) {
                console.error("Gagal memuat berkas:", file.name, err);
            }
        }

        setImages((prev) => [...prev, ...newItems]);
        setIsLoadingImages(false);
    }, []);

    // Calculate current target options
    const currentOptions: ResizeOptions = useMemo(() => {
        return {
            mode,
            percentage,
            width: customWidth,
            height: customHeight,
            lockAspectRatio,
            maxDimension,
            outputFormat,
            outputQuality: outputQuality / 100
        };
    }, [mode, percentage, customWidth, customHeight, lockAspectRatio, maxDimension, outputFormat, outputQuality]);

    // Calculate estimated dimensions for active item
    const estimatedDimensions = useMemo(() => {
        if (!activeItem) return { width: 0, height: 0 };
        return calculateTargetDimensions(activeItem.width, activeItem.height, currentOptions);
    }, [activeItem, currentOptions]);

    // Process a single image
    const processSingleImage = useCallback(
        async (targetIndex: number) => {
            const item = images[targetIndex];
            if (!item) return;

            setImages((prev) =>
                prev.map((img, i) => (i === targetIndex ? { ...img, status: "processing", progress: 20 } : img))
            );

            try {
                const imgElement = await new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error("Gagal memuat gambar"));
                    img.src = item.url;
                });

                // Compute dimensions specific to this item's aspect ratio if using percentage or fit-max
                const itemOptions: ResizeOptions = {
                    ...currentOptions,
                    width: mode === "dimensions" ? customWidth : undefined,
                    height: mode === "dimensions" ? customHeight : undefined
                };

                const res = await resizeImage(imgElement, item.type, itemOptions);

                setImages((prev) =>
                    prev.map((img, i) =>
                        i === targetIndex
                            ? {
                                  ...img,
                                  status: "done",
                                  progress: 100,
                                  resultBlob: res.blob,
                                  resultUrl: res.url,
                                  resultWidth: res.width,
                                  resultHeight: res.height,
                                  resultSize: res.blob.size,
                                  durationMs: res.durationMs
                              }
                            : img
                    )
                );
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat mengubah ukuran gambar";
                setImages((prev) =>
                    prev.map((img, i) =>
                        i === targetIndex ? { ...img, status: "error", progress: 0, error: msg } : img
                    )
                );
            }
        },
        [images, currentOptions, mode, customWidth, customHeight]
    );

    // Process all images in batch
    const handleProcessAll = useCallback(async () => {
        setIsProcessingBatch(true);
        for (let i = 0; i < images.length; i++) {
            await processSingleImage(i);
        }
        setIsProcessingBatch(false);
    }, [images, processSingleImage]);

    // Download single result
    const handleDownloadSingle = (item: ImageItem) => {
        if (!item.resultUrl) return;
        const ext =
            outputFormat === "image/png"
                ? "png"
                : outputFormat === "image/jpeg"
                ? "jpg"
                : outputFormat === "image/webp"
                ? "webp"
                : item.name.split(".").pop() || "jpg";
        const nameWithoutExt = item.name.replace(/\.[^/.]+$/, "");
        const fileName = `${nameWithoutExt}-resized-${item.resultWidth}x${item.resultHeight}.${ext}`;

        const a = document.createElement("a");
        a.href = item.resultUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Download all as ZIP
    const handleDownloadZip = async () => {
        const completed = images.filter((img) => img.status === "done" && img.resultBlob);
        if (completed.length === 0) return;

        setIsZipping(true);
        try {
            const zip = new JSZip();

            completed.forEach((img) => {
                if (img.resultBlob) {
                    const ext =
                        outputFormat === "image/png"
                            ? "png"
                            : outputFormat === "image/jpeg"
                            ? "jpg"
                            : outputFormat === "image/webp"
                            ? "webp"
                            : img.name.split(".").pop() || "jpg";
                    const nameWithoutExt = img.name.replace(/\.[^/.]+$/, "");
                    const fileName = `${nameWithoutExt}-resized-${img.resultWidth}x${img.resultHeight}.${ext}`;
                    zip.file(fileName, img.resultBlob);
                }
            });

            const content = await zip.generateAsync({ type: "blob" });
            const zipUrl = URL.createObjectURL(content);

            const a = document.createElement("a");
            a.href = zipUrl;
            a.download = `datascry-resized-batch-${new Date().getTime()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(zipUrl);
        } catch (err) {
            console.error("Gagal membuat arsip ZIP:", err);
            setErrorMessage("Gagal membuat berkas ZIP");
        } finally {
            setIsZipping(false);
        }
    };

    // Delete single item
    const handleDeleteImage = (indexToDelete: number) => {
        setImages((prev) => {
            const target = prev[indexToDelete];
            if (target?.url) URL.revokeObjectURL(target.url);
            if (target?.resultUrl) URL.revokeObjectURL(target.resultUrl);

            return prev.filter((_, i) => i !== indexToDelete);
        });

        if (activeIdx >= indexToDelete && activeIdx > 0) {
            setActiveIdx((prev) => prev - 1);
        }
    };

    // Reset All
    const handleResetAll = () => {
        images.forEach((img) => {
            if (img.url) URL.revokeObjectURL(img.url);
            if (img.resultUrl) URL.revokeObjectURL(img.resultUrl);
        });
        setImages([]);
        setActiveIdx(0);
        setErrorMessage(null);
    };

    // Active Lightbox Item
    const activeLightboxItem: LightboxItem | null = useMemo(() => {
        if (!activeItem) return null;
        const targetUrl = activeItem.resultUrl || activeItem.url;
        const targetWidth = activeItem.resultWidth || activeItem.width;
        const targetHeight = activeItem.resultHeight || activeItem.height;
        const targetSize = activeItem.resultSize || activeItem.size;

        return {
            url: targetUrl,
            title: activeItem.resultUrl
                ? `Hasil Resize: ${activeItem.name} (${targetWidth}×${targetHeight} px)`
                : `Foto Asli: ${activeItem.name} (${targetWidth}×${targetHeight} px)`,
            width: targetWidth,
            height: targetHeight,
            size: targetSize,
            mimeType: outputFormat === "original" ? activeItem.type : outputFormat
        };
    }, [activeItem, outputFormat]);

    const completedCount = images.filter((img) => img.status === "done").length;

    return (
        <div className="space-y-6">
            {/* Error Banner */}
            {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-rose-400 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                    <button
                        onClick={() => setErrorMessage(null)}
                        className="p-1 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Empty State: Dropzone */}
            {images.length === 0 ? (
                <div className="space-y-4">
                    <Dropzone
                        onFilesAccepted={handleFiles}
                        accept="image/*"
                        title="Tarik & Letakkan Foto untuk Mengubah Ukuran (Resize)"
                        description="Mendukung JPG, PNG, WebP, dan BMP. Ubah resolusi massal dengan kunci rasio aspek dan kompresi cerdas 100% lokal."
                    />

                    {/* Feature Highlights Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div className="p-4 rounded-2xl bg-surface/50 border border-border/70 space-y-1.5 text-center sm:text-left">
                            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto sm:mx-0">
                                <Scaling size={16} />
                            </div>
                            <h4 className="text-xs font-bold text-foreground">3 Mode Fleksibel</h4>
                            <p className="text-[11px] text-foreground/60 leading-relaxed">
                                Sesuaikan via persentase cepat, dimensi piksel tepat, atau batas sisi maksimal dokumen CASN/BUMN.
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-surface/50 border border-border/70 space-y-1.5 text-center sm:text-left">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto sm:mx-0">
                                <Sparkles size={16} />
                            </div>
                            <h4 className="text-xs font-bold text-foreground">Anti-Pecah & Mulus</h4>
                            <p className="text-[11px] text-foreground/60 leading-relaxed">
                                Ditenagai algoritma stepped downsampling berkualitas tinggi agar gambar tetap tajam tanpa gerigi.
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-surface/50 border border-border/70 space-y-1.5 text-center sm:text-left">
                            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto sm:mx-0">
                                <ShieldCheck size={16} />
                            </div>
                            <h4 className="text-xs font-bold text-foreground">100% Privat & Cepat</h4>
                            <p className="text-[11px] text-foreground/60 leading-relaxed">
                                Pemrosesan instan langsung di memori peramban tanpa antrean server dan tanpa risiko kebocoran data.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                /* Workspace Layout */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Viewport & Carousel (Col 7) */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* Main Preview Card */}
                        <div className="p-4 sm:p-5 rounded-3xl bg-surface/40 border border-border/80 backdrop-blur-md space-y-4 shadow-xl">
                            {/* Card Header */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                                        <Scaling size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-xs sm:text-sm font-bold text-foreground truncate max-w-xs">
                                            {activeItem?.name}
                                        </h3>
                                        <p className="text-[11px] text-foreground/50">
                                            {activeItem ? `${activeItem.width}×${activeItem.height} px • ${formatBytes(activeItem.size)}` : ""}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setIsLightboxOpen(true)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-surface/80 hover:bg-surface border border-border/70 text-foreground/80 hover:text-foreground transition-all active:scale-95 cursor-pointer shadow-xs"
                                        title="Inspeksi Layar Penuh"
                                    >
                                        <Eye size={13} className="text-primary" />
                                        <span className="hidden sm:inline">Inspeksi 400%</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleResetAll}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all active:scale-95 cursor-pointer"
                                        title="Ganti semua gambar"
                                    >
                                        <RotateCcw size={13} />
                                        <span className="hidden sm:inline">Ganti Foto</span>
                                    </button>
                                </div>
                            </div>

                            {/* Dimension Comparison Badges */}
                            <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface/80 border border-border/70 text-foreground/70">
                                        <FileImage size={12} className="text-foreground/50" />
                                        <span>Asli: <strong className="text-foreground">{activeItem?.width}×{activeItem?.height}</strong> ({formatBytes(activeItem?.size || 0)})</span>
                                    </span>

                                    <span className="text-foreground/30 font-bold">→</span>

                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-medium">
                                        <Scaling size={12} className="text-cyan-400" />
                                        <span>
                                            Target:{" "}
                                            <strong className="text-cyan-300 font-bold">
                                                {activeItem?.status === "done" && activeItem.resultWidth
                                                    ? `${activeItem.resultWidth}×${activeItem.resultHeight}`
                                                    : `${estimatedDimensions.width}×${estimatedDimensions.height}`}
                                            </strong>
                                            {activeItem?.status === "done" && activeItem.resultSize && (
                                                <span> ({formatBytes(activeItem.resultSize)})</span>
                                            )}
                                        </span>
                                    </span>
                                </div>

                                {activeItem?.status === "done" && activeItem.resultSize && activeItem.size > 0 && (
                                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                        {activeItem.resultSize < activeItem.size
                                            ? `Hemat ${Math.round((1 - activeItem.resultSize / activeItem.size) * 100)}%`
                                            : `Resolusi Baru`}
                                    </span>
                                )}
                            </div>

                            {/* Main Preview Canvas Viewport */}
                            <div className="min-h-70 sm:min-h-90 rounded-2xl overflow-hidden border border-border/70 bg-black/40 flex items-center justify-center p-3 relative group">
                                {activeItem?.status === "processing" ? (
                                    <div className="py-16 text-center space-y-3 max-w-sm mx-auto">
                                        <Loader2 size={36} className="animate-spin text-cyan-400 mx-auto" />
                                        <p className="text-xs sm:text-sm font-bold text-foreground">
                                            Sedang Mengubah Ukuran Gambar...
                                        </p>
                                        <p className="text-[11px] text-foreground/50">
                                            Target: {estimatedDimensions.width} × {estimatedDimensions.height} px
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative flex items-center justify-center w-full h-full">
                                        <img
                                            src={activeItem?.resultUrl || activeItem?.url}
                                            alt={activeItem?.name}
                                            className="max-h-75 sm:max-h-100 object-contain rounded-xl shadow-md"
                                        />

                                        {/* Status badge */}
                                        {activeItem?.status === "done" && (
                                            <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md flex items-center gap-1">
                                                <Check size={11} />
                                                <span>Berhasil Diubah</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Viewport Action Buttons */}
                            {activeItem?.status === "done" && activeItem.resultUrl && (
                                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/60">
                                    <div className="text-xs text-foreground/60">
                                        <span>Diproses dalam <strong>{activeItem.durationMs || 0} ms</strong></span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => processSingleImage(activeIdx)}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-surface/80 hover:bg-surface border border-border/80 text-foreground transition-all active:scale-95 cursor-pointer shadow-xs"
                                        >
                                            <RotateCcw size={13} className="text-amber-400" />
                                            <span>Ubah Ulang</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDownloadSingle(activeItem)}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition-all active:scale-95 shadow-md shadow-cyan-600/20 cursor-pointer"
                                        >
                                            <Download size={14} />
                                            <span>Unduh Gambar ({formatBytes(activeItem.resultSize || 0)})</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Batch Thumbnails Carousel Strip (If multiple files) */}
                        {images.length > 1 && (
                            <div className="p-3.5 rounded-2xl bg-surface/40 border border-border/70 space-y-2">
                                <div className="flex items-center justify-between text-xs text-foreground/70 px-1">
                                    <span className="font-bold">Antrean Foto ({images.length})</span>
                                    <span>{completedCount} dari {images.length} selesai</span>
                                </div>

                                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                                    {images.map((item, idx) => {
                                        const isSelected = idx === activeIdx;
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => setActiveIdx(idx)}
                                                className={`relative group shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                                                    isSelected
                                                        ? "border-cyan-500 ring-2 ring-cyan-500/30 shadow-md scale-105"
                                                        : "border-border/70 hover:border-border opacity-70 hover:opacity-100"
                                                }`}
                                            >
                                                <img
                                                    src={item.resultUrl || item.url}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />

                                                {item.status === "done" && (
                                                    <div className="absolute top-1 right-1 bg-emerald-500 rounded-full p-0.5 text-white shadow-xs">
                                                        <Check size={10} />
                                                    </div>
                                                )}
                                                {item.status === "processing" && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                        <Loader2 size={14} className="text-cyan-400 animate-spin" />
                                                    </div>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteImage(idx);
                                                    }}
                                                    className="absolute bottom-1 right-1 p-1 rounded-md bg-black/70 hover:bg-rose-500 text-white/80 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Hapus berkas"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Resize Control Panel (Col 5) */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="p-5 rounded-3xl bg-surface/50 border border-border/80 backdrop-blur-md space-y-5 shadow-xl">
                            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                                <Sliders size={18} className="text-cyan-400" />
                                <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                                    Pengaturan Ukuran (Resize)
                                </h3>
                            </div>

                            {/* Mode Selector Tabs */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-foreground">
                                    Pilih Metode Pengubahan Ukuran
                                </label>
                                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-surface/80 border border-border/70">
                                    <button
                                        type="button"
                                        onClick={() => setMode("percentage")}
                                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                                            mode === "percentage"
                                                ? "bg-cyan-600 text-white shadow-xs"
                                                : "text-foreground/70 hover:text-foreground"
                                        }`}
                                    >
                                        <Percent size={13} />
                                        <span>Persentase</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setMode("dimensions")}
                                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                                            mode === "dimensions"
                                                ? "bg-cyan-600 text-white shadow-xs"
                                                : "text-foreground/70 hover:text-foreground"
                                        }`}
                                    >
                                        <Scaling size={13} />
                                        <span>Piksel Presisi</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setMode("fit-max")}
                                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                                            mode === "fit-max"
                                                ? "bg-cyan-600 text-white shadow-xs"
                                                : "text-foreground/70 hover:text-foreground"
                                        }`}
                                    >
                                        <MoveDiagonal2 size={13} />
                                        <span>Batas Sisi</span>
                                    </button>
                                </div>
                            </div>

                            {/* Mode 1: Percentage Controls */}
                            {mode === "percentage" && (
                                <div className="space-y-3 pt-1">
                                    <div className="flex justify-between text-xs font-bold text-foreground">
                                        <span>Skala Persentase:</span>
                                        <span className="text-cyan-400 font-extrabold">{percentage}%</span>
                                    </div>

                                    {/* Quick Percentage Chips */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {PERCENT_PRESETS.map((pct) => (
                                            <button
                                                key={pct}
                                                type="button"
                                                onClick={() => setPercentage(pct)}
                                                className={`py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                                    percentage === pct
                                                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-xs"
                                                        : "bg-surface/60 hover:bg-surface border-border/70 text-foreground/70"
                                                }`}
                                            >
                                                {pct}%
                                            </button>
                                        ))}
                                    </div>

                                    {/* Slider */}
                                    <div className="space-y-1 pt-1">
                                        <input
                                            type="range"
                                            min={10}
                                            max={250}
                                            step={5}
                                            value={percentage}
                                            onChange={(e) => setPercentage(parseInt(e.target.value))}
                                            className="w-full accent-cyan-500 cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[10px] text-foreground/40">
                                            <span>10% (Kecil)</span>
                                            <span>100% (Asli)</span>
                                            <span>250% (Besar)</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Mode 2: Exact Dimensions Controls */}
                            {mode === "dimensions" && (
                                <div className="space-y-3 pt-1">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[11px] font-bold text-foreground/70">
                                                Lebar (Width px)
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={10000}
                                                value={customWidth}
                                                onChange={(e) => handleWidthChange(parseInt(e.target.value) || 1)}
                                                className="w-full px-3 py-2 rounded-xl bg-surface/80 border border-border/80 text-foreground text-xs font-bold focus:outline-hidden focus:border-cyan-500"
                                            />
                                        </div>

                                        {/* Lock Aspect Ratio Toggle */}
                                        <div className="pt-5">
                                            <button
                                                type="button"
                                                onClick={() => setLockAspectRatio(!lockAspectRatio)}
                                                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                                                    lockAspectRatio
                                                        ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-xs"
                                                        : "bg-surface/70 border-border/70 text-foreground/40"
                                                }`}
                                                title={lockAspectRatio ? "Rasio Aspek Terkunci" : "Rasio Aspek Bebas"}
                                            >
                                                {lockAspectRatio ? <Lock size={15} /> : <Unlock size={15} />}
                                            </button>
                                        </div>

                                        <div className="flex-1 space-y-1">
                                            <label className="text-[11px] font-bold text-foreground/70">
                                                Tinggi (Height px)
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={10000}
                                                value={customHeight}
                                                onChange={(e) => handleHeightChange(parseInt(e.target.value) || 1)}
                                                className="w-full px-3 py-2 rounded-xl bg-surface/80 border border-border/80 text-foreground text-xs font-bold focus:outline-hidden focus:border-cyan-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Preset Resolutions Grid */}
                                    <div className="space-y-1.5 pt-1">
                                        <label className="text-[11px] font-bold text-foreground/60">
                                            Preset Resolusi Populer
                                        </label>
                                        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                                            {PRESET_RESOLUTIONS.map((preset) => (
                                                <button
                                                    key={preset.label}
                                                    type="button"
                                                    onClick={() => {
                                                        setCustomWidth(preset.width);
                                                        setCustomHeight(preset.height);
                                                    }}
                                                    className="p-2 rounded-xl bg-surface/60 hover:bg-surface border border-border/70 text-left text-[11px] transition-all cursor-pointer flex items-center justify-between"
                                                >
                                                    <div className="truncate mr-1">
                                                        <p className="font-bold text-foreground truncate">{preset.label}</p>
                                                        <p className="text-[10px] text-foreground/50">{preset.width}×{preset.height}</p>
                                                    </div>
                                                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                                                        {preset.tag}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Mode 3: Fit Within Max Dimension */}
                            {mode === "fit-max" && (
                                <div className="space-y-3 pt-1">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-bold text-foreground">
                                            <span>Batas Sisi Terpanjang Maksimal:</span>
                                            <span className="text-cyan-400 font-extrabold">{maxDimension} px</span>
                                        </div>
                                        <p className="text-[11px] text-foreground/50 leading-relaxed">
                                            Sisi terpanjang (lebar/tinggi) akan dibatasi maksimal sebesar nilai ini tanpa mengubah rasio asli (cocok untuk syarat pendaftaran CASN / BUMN).
                                        </p>
                                    </div>

                                    {/* Quick Max Chips */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {FIT_MAX_PRESETS.map((m) => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setMaxDimension(m)}
                                                className={`py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                                    maxDimension === m
                                                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-xs"
                                                        : "bg-surface/60 hover:bg-surface border-border/70 text-foreground/70"
                                                }`}
                                            >
                                                {m} px
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-1 pt-1">
                                        <input
                                            type="range"
                                            min={400}
                                            max={4000}
                                            step={50}
                                            value={maxDimension}
                                            onChange={(e) => setMaxDimension(parseInt(e.target.value))}
                                            className="w-full accent-cyan-500 cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[10px] text-foreground/40">
                                            <span>400 px</span>
                                            <span>2000 px</span>
                                            <span>4000 px</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Target Dimension Result Banner */}
                            <div className="p-2.5 rounded-xl bg-surface/70 border border-border/70 text-center text-xs text-foreground/70">
                                Estimasi Dimensi Hasil:{" "}
                                <strong className="text-cyan-400 font-bold">
                                    {estimatedDimensions.width} × {estimatedDimensions.height} px
                                </strong>
                            </div>

                            {/* Output Format Settings */}
                            <div className="space-y-2.5 pt-2 border-t border-border/60">
                                <label className="text-xs font-bold text-foreground">
                                    Format Output
                                </label>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {[
                                        { id: "original", label: "Sesuai Asli" },
                                        { id: "image/jpeg", label: "JPG" },
                                        { id: "image/png", label: "PNG" },
                                        { id: "image/webp", label: "WebP" }
                                    ].map((fmt) => (
                                        <button
                                            key={fmt.id}
                                            type="button"
                                            onClick={() => setOutputFormat(fmt.id as any)}
                                            className={`py-1.5 px-1 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                                                outputFormat === fmt.id
                                                    ? "bg-cyan-600 text-white border-cyan-600 shadow-xs"
                                                    : "bg-surface/70 hover:bg-surface border-border/70 text-foreground/70"
                                            }`}
                                        >
                                            {fmt.label}
                                        </button>
                                    ))}
                                </div>

                                {(outputFormat === "image/jpeg" || outputFormat === "image/webp") && (
                                    <div className="space-y-1 pt-1">
                                        <div className="flex justify-between text-xs text-foreground/70">
                                            <span>Kualitas Gambar:</span>
                                            <span className="font-bold text-foreground">{outputQuality}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={30}
                                            max={100}
                                            value={outputQuality}
                                            onChange={(e) => setOutputQuality(parseInt(e.target.value))}
                                            className="w-full accent-cyan-500 cursor-pointer"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Main CTA Actions */}
                            <div className="pt-2 space-y-2">
                                <button
                                    type="button"
                                    onClick={() => processSingleImage(activeIdx)}
                                    disabled={activeItem?.status === "processing" || isProcessingBatch}
                                    className="w-full py-3.5 px-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/25 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    {activeItem?.status === "processing" ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Sedang Mengubah Ukuran...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Scaling size={16} />
                                            <span>Ubah Ukuran Foto Ini ({estimatedDimensions.width}×{estimatedDimensions.height})</span>
                                        </>
                                    )}
                                </button>

                                {/* Batch Process Button if multiple images */}
                                {images.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={handleProcessAll}
                                        disabled={isProcessingBatch || images.every((img) => img.status === "done")}
                                        className="w-full py-2.5 px-4 rounded-xl bg-surface/80 hover:bg-surface border border-border/80 text-foreground/80 hover:text-foreground font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                    >
                                        <Layers size={14} className="text-cyan-400" />
                                        <span>Ubah Ukuran Semua ({images.length} Foto)</span>
                                    </button>
                                )}

                                {/* Download All ZIP Button if completed */}
                                {completedCount > 1 && (
                                    <button
                                        type="button"
                                        onClick={handleDownloadZip}
                                        disabled={isZipping}
                                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-xs"
                                    >
                                        {isZipping ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <FolderArchive size={14} />
                                        )}
                                        <span>Unduh Semua ({completedCount} Foto .ZIP)</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Media Lightbox Modal */}
            <MediaLightboxModal
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                item={activeLightboxItem}
                accentColor="blue"
                downloadLabel="Unduh Foto"
                onDownload={() => activeItem && handleDownloadSingle(activeItem)}
            />
        </div>
    );
}
