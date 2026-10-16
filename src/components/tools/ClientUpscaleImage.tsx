"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Dropzone from "@/components/ui/Dropzone";
import JSZip from "jszip";
import {
    Sparkles,
    Download,
    CheckCircle2,
    Loader2,
    FolderArchive,
    Sliders,
    Eye,
    AlertCircle,
    X,
    Plus,
    RotateCcw,
    Layers,
    FileImage,
    Maximize2,
    Check,
    ZoomIn,
    Trash2,
    FileText,
    Camera,
    Tv
} from "lucide-react";
import MediaLightboxModal, { LightboxItem } from "@/components/shared/MediaLightboxModal";
import UpscaleComparisonSlider from "@/components/tools/UpscaleComparisonSlider";
import { upscaleImage, UpscaleMode, UpscaleOptions } from "@/lib/imageUpscaler";

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
    progressStep: string;
    resultBlob?: Blob;
    resultUrl?: string;
    resultWidth?: number;
    resultHeight?: number;
    resultSize?: number;
    durationMs?: number;
    error?: string;
}

const UPSCALE_MODES: {
    id: UpscaleMode;
    label: string;
    desc: string;
    icon: typeof Camera;
    color: string;
    defaultSharpness: number;
    defaultDenoise: number;
    defaultClarity: number;
}[] = [
    {
        id: "photo",
        label: "Foto & Potret",
        desc: "Super-Resolution tajam & alami untuk foto orang, pemandangan, dan produk",
        icon: Camera,
        color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
        defaultSharpness: 65,
        defaultDenoise: 35,
        defaultClarity: 25
    },
    {
        id: "anime",
        label: "Anime & Ilustrasi",
        desc: "Tepian kartun tegas dan garis bersih bebas blur & noise",
        icon: Tv,
        color: "text-purple-400 bg-purple-500/15 border-purple-500/30",
        defaultSharpness: 75,
        defaultDenoise: 50,
        defaultClarity: 20
    },
    {
        id: "document",
        label: "Dokumen & Teks",
        desc: "Pembersihan latar & penajaman huruf scan, struk, dan sertifikat",
        icon: FileText,
        color: "text-amber-400 bg-amber-500/15 border-amber-500/30",
        defaultSharpness: 80,
        defaultDenoise: 40,
        defaultClarity: 40
    },
    {
        id: "vintage",
        label: "Restorasi Foto Jadul",
        desc: "Pembersih grain & noise lembut untuk foto kenangan lawas",
        icon: Sparkles,
        color: "text-rose-400 bg-rose-500/15 border-rose-500/30",
        defaultSharpness: 50,
        defaultDenoise: 65,
        defaultClarity: 20
    }
];

const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ClientUpscaleImage() {
    // File State
    const [images, setImages] = useState<ImageItem[]>([]);
    const [activeIdx, setActiveIdx] = useState<number>(0);
    const [isLoadingImages, setIsLoadingImages] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Upscale Settings State
    const [scaleFactor, setScaleFactor] = useState<number>(2); // 2, 4, or custom
    const [customScale, setCustomScale] = useState<number>(3);
    const [mode, setMode] = useState<UpscaleMode>("photo");
    const [sharpness, setSharpness] = useState<number>(65);
    const [denoise, setDenoise] = useState<number>(35);
    const [clarity, setClarity] = useState<number>(25);

    // Export Settings
    const [outputFormat, setOutputFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/png");
    const [outputQuality, setOutputQuality] = useState<number>(95); // 1 - 100

    // Processing State
    const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
    const [isZipping, setIsZipping] = useState<boolean>(false);

    // Fullscreen Lightbox
    const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

    const activeItem = images[activeIdx] || null;

    // Apply default slider values when mode changes
    const handleModeChange = (newMode: UpscaleMode) => {
        setMode(newMode);
        const preset = UPSCALE_MODES.find((m) => m.id === newMode);
        if (preset) {
            setSharpness(preset.defaultSharpness);
            setDenoise(preset.defaultDenoise);
            setClarity(preset.defaultClarity);
        }
    };

    // Clean up Object URLs on unmount
    useEffect(() => {
        return () => {
            images.forEach((img) => {
                if (img.url) URL.revokeObjectURL(img.url);
                if (img.resultUrl) URL.revokeObjectURL(img.resultUrl);
            });
        };
    }, []);

    // Load dropped/uploaded images
    const handleFiles = useCallback(async (incomingFiles: File[]) => {
        setErrorMessage(null);
        setIsLoadingImages(true);

        const validFiles = incomingFiles.filter((f) =>
            f.type.startsWith("image/") || /\.(jpe?g|png|webp|bmp|gif)$/i.test(f.name)
        );

        if (validFiles.length === 0) {
            setErrorMessage("Harap unggah berkas gambar valid (JPG, PNG, WebP, atau BMP).");
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
                    progress: 0,
                    progressStep: "Siap ditingkatkan"
                });
            } catch (err) {
                console.error("Gagal memuat berkas:", file.name, err);
            }
        }

        setImages((prev) => {
            const updated = [...prev, ...newItems];
            return updated;
        });

        setIsLoadingImages(false);
    }, []);

    // Calculate effective scale
    const effectiveScale = scaleFactor === -1 ? customScale : scaleFactor;

    // Process a single image
    const processSingleImage = useCallback(
        async (targetIndex: number) => {
            const item = images[targetIndex];
            if (!item) return;

            setImages((prev) =>
                prev.map((img, i) =>
                    i === targetIndex
                        ? { ...img, status: "processing", progress: 5, progressStep: "Memulai mesin AI..." }
                        : img
                )
            );

            try {
                const imgElement = await new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error("Gagal memuat gambar"));
                    img.src = item.url;
                });

                const options: UpscaleOptions = {
                    scale: effectiveScale,
                    mode,
                    sharpness,
                    denoise,
                    clarity,
                    onProgress: (prog, step) => {
                        setImages((prev) =>
                            prev.map((img, i) =>
                                i === targetIndex ? { ...img, progress: prog, progressStep: step } : img
                            )
                        );
                    }
                };

                const res = await upscaleImage(
                    imgElement,
                    options,
                    outputFormat,
                    outputQuality / 100
                );

                setImages((prev) =>
                    prev.map((img, i) =>
                        i === targetIndex
                            ? {
                                  ...img,
                                  status: "done",
                                  progress: 100,
                                  progressStep: "Selesai!",
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
                const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses gambar";
                setImages((prev) =>
                    prev.map((img, i) =>
                        i === targetIndex
                            ? { ...img, status: "error", progress: 0, progressStep: "Gagal", error: msg }
                            : img
                    )
                );
            }
        },
        [images, effectiveScale, mode, sharpness, denoise, clarity, outputFormat, outputQuality]
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
        const extension = outputFormat === "image/png" ? "png" : outputFormat === "image/webp" ? "webp" : "jpg";
        const nameWithoutExt = item.name.replace(/\.[^/.]+$/, "");
        const fileName = `${nameWithoutExt}-upscaled-${item.resultWidth}x${item.resultHeight}.${extension}`;

        const a = document.createElement("a");
        a.href = item.resultUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Download all completed as ZIP
    const handleDownloadZip = async () => {
        const completed = images.filter((img) => img.status === "done" && img.resultBlob);
        if (completed.length === 0) return;

        setIsZipping(true);
        try {
            const zip = new JSZip();
            const extension = outputFormat === "image/png" ? "png" : outputFormat === "image/webp" ? "webp" : "jpg";

            completed.forEach((img, idx) => {
                if (img.resultBlob) {
                    const nameWithoutExt = img.name.replace(/\.[^/.]+$/, "");
                    const fileName = `${nameWithoutExt}-upscaled-${img.resultWidth}x${img.resultHeight}.${extension}`;
                    zip.file(fileName, img.resultBlob);
                }
            });

            const content = await zip.generateAsync({ type: "blob" });
            const zipUrl = URL.createObjectURL(content);

            const a = document.createElement("a");
            a.href = zipUrl;
            a.download = `datascry-upscale-batch-${new Date().getTime()}.zip`;
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

    // Delete item
    const handleDeleteImage = (indexToDelete: number) => {
        setImages((prev) => {
            const target = prev[indexToDelete];
            if (target?.url) URL.revokeObjectURL(target.url);
            if (target?.resultUrl) URL.revokeObjectURL(target.resultUrl);

            const next = prev.filter((_, i) => i !== indexToDelete);
            return next;
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

    // Prepare Lightbox item for active image
    const activeLightboxItem: LightboxItem | null = useMemo(() => {
        if (!activeItem) return null;
        const targetUrl = activeItem.resultUrl || activeItem.url;
        const targetWidth = activeItem.resultWidth || activeItem.width;
        const targetHeight = activeItem.resultHeight || activeItem.height;
        const targetSize = activeItem.resultSize || activeItem.size;

        return {
            url: targetUrl,
            title: activeItem.resultUrl ? `Hasil Upscale: ${activeItem.name}` : `Foto Asli: ${activeItem.name}`,
            width: targetWidth,
            height: targetHeight,
            size: targetSize,
            mimeType: outputFormat
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
                        title="Tarik & Letakkan Foto untuk Ditingkatkan Resolusinya"
                        description="Mendukung JPG, PNG, WebP, dan BMP. Diperbesar hingga 4× lebih tajam 100% lokal di browser Anda."
                    />

                    {/* Feature Highlights Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div className="p-4 rounded-2xl bg-surface/50 border border-border/70 space-y-1.5 text-center sm:text-left">
                            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto sm:mx-0">
                                <Maximize2 size={16} />
                            </div>
                            <h4 className="text-xs font-bold text-foreground">Hingga 4× Ultra HD</h4>
                            <p className="text-[11px] text-foreground/60 leading-relaxed">
                                Perbesar foto beresolusi kecil menjadi gambar tajam beresolusi tinggi yang siap dicetak.
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-surface/50 border border-border/70 space-y-1.5 text-center sm:text-left">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto sm:mx-0">
                                <Sparkles size={16} />
                            </div>
                            <h4 className="text-xs font-bold text-foreground">Restorasi & De-Noise</h4>
                            <p className="text-[11px] text-foreground/60 leading-relaxed">
                                Hapus artefak kompresi JPEG buram dan pertahankan detail tepian wajah atau teks.
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-surface/50 border border-border/70 space-y-1.5 text-center sm:text-left">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto sm:mx-0">
                                <Sliders size={16} />
                            </div>
                            <h4 className="text-xs font-bold text-foreground">100% Privat di Browser</h4>
                            <p className="text-[11px] text-foreground/60 leading-relaxed">
                                Berkas tidak pernah diunggah ke server cloud mana pun. Aman untuk data sensitif.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                /* Workspace Area */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Preview Viewport & Queue Thumbnails (Col 7) */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* Main Viewport Card */}
                        <div className="p-4 sm:p-5 rounded-3xl bg-surface/40 border border-border/80 backdrop-blur-md space-y-4 shadow-xl">
                            {/* Viewport Header */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                                        <Sparkles size={16} />
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
                                    {activeItem?.resultUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setIsLightboxOpen(true)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-surface/80 hover:bg-surface border border-border/70 text-foreground/80 hover:text-foreground transition-all active:scale-95 cursor-pointer shadow-xs"
                                            title="Inspeksi Layar Penuh (Zoom 400%)"
                                        >
                                            <Eye size={13} className="text-primary" />
                                            <span className="hidden sm:inline">Inspeksi 400%</span>
                                        </button>
                                    )}

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

                            {/* Viewport Content: Interactive Split Slider or Processing State */}
                            <div className="min-h-70 sm:min-h-95 flex items-center justify-center">
                                {activeItem?.status === "processing" ? (
                                    <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
                                        <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                                            <Loader2 size={40} className="animate-spin text-primary" />
                                            <Sparkles size={18} className="absolute text-purple-400 animate-pulse" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">
                                                {activeItem.progressStep || "Sedang Memproses..."}
                                            </p>
                                            <p className="text-xs text-foreground/50 mt-1">
                                                Resolusi target: {Math.round(activeItem.width * effectiveScale)}×{Math.round(activeItem.height * effectiveScale)} px
                                            </p>
                                        </div>
                                        <div className="w-full bg-surface rounded-full h-2 overflow-hidden border border-border/70">
                                            <div
                                                className="bg-linear-to-r from-purple-500 to-primary h-full transition-all duration-300 rounded-full"
                                                style={{ width: `${activeItem.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                ) : activeItem?.status === "done" && activeItem.resultUrl ? (
                                    <UpscaleComparisonSlider
                                        originalUrl={activeItem.url}
                                        resultUrl={activeItem.resultUrl}
                                        originalWidth={activeItem.width}
                                        originalHeight={activeItem.height}
                                        resultWidth={activeItem.resultWidth || activeItem.width * effectiveScale}
                                        resultHeight={activeItem.resultHeight || activeItem.height * effectiveScale}
                                        originalSize={formatBytes(activeItem.size)}
                                        resultSize={formatBytes(activeItem.resultSize || 0)}
                                    />
                                ) : (
                                    /* Idle Preview */
                                    <div className="relative rounded-2xl overflow-hidden border border-border/70 bg-black/40 w-full flex items-center justify-center p-2 group">
                                        <img
                                            src={activeItem?.url}
                                            alt={activeItem?.name}
                                            className="max-h-75 sm:max-h-100 object-contain rounded-xl shadow-md"
                                        />
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-4 text-center">
                                            <p className="text-xs text-white/90 font-bold mb-2">
                                                Tekan &quot;Tingkatkan Resolusi&quot; untuk memulai
                                            </p>
                                            <span className="text-[11px] text-white/70">
                                                Target: {Math.round((activeItem?.width || 0) * effectiveScale)}×{Math.round((activeItem?.height || 0) * effectiveScale)} px ({effectiveScale}×)
                                            </span>
                                        </div>
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
                                            <span>Proses Ulang</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDownloadSingle(activeItem)}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary hover:bg-primary-focus text-white transition-all active:scale-95 shadow-md shadow-primary/20 cursor-pointer"
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
                                                        ? "border-primary ring-2 ring-primary/30 shadow-md scale-105"
                                                        : "border-border/70 hover:border-border opacity-70 hover:opacity-100"
                                                }`}
                                            >
                                                <img
                                                    src={item.resultUrl || item.url}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />

                                                {/* Status badge */}
                                                {item.status === "done" && (
                                                    <div className="absolute top-1 right-1 bg-emerald-500 rounded-full p-0.5 text-white shadow-xs">
                                                        <Check size={10} />
                                                    </div>
                                                )}
                                                {item.status === "processing" && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                        <Loader2 size={14} className="text-primary animate-spin" />
                                                    </div>
                                                )}

                                                {/* Delete button */}
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

                    {/* Right Column: Upscale Parameter Controls (Col 5) */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="p-5 rounded-3xl bg-surface/50 border border-border/80 backdrop-blur-md space-y-5 shadow-xl">
                            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                                <Sliders size={18} className="text-primary" />
                                <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                                    Pengaturan Super-Resolution
                                </h3>
                            </div>

                            {/* Scale Factor Selector */}
                            <div className="space-y-2.5">
                                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                                    <span>Tingkat Perbesaran (Skala)</span>
                                    <span className="text-primary font-extrabold">{effectiveScale}× ({effectiveScale * 100}%)</span>
                                </label>

                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setScaleFactor(2)}
                                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                                            scaleFactor === 2
                                                ? "bg-primary text-white border-primary shadow-md shadow-primary/25 font-bold"
                                                : "bg-surface/80 hover:bg-surface border-border/70 text-foreground/80 hover:text-foreground font-semibold"
                                        }`}
                                    >
                                        <div className="text-sm font-black">2×</div>
                                        <div className="text-[10px] opacity-75">HD (200%)</div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setScaleFactor(4)}
                                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                                            scaleFactor === 4
                                                ? "bg-primary text-white border-primary shadow-md shadow-primary/25 font-bold"
                                                : "bg-surface/80 hover:bg-surface border-border/70 text-foreground/80 hover:text-foreground font-semibold"
                                        }`}
                                    >
                                        <div className="text-sm font-black">4×</div>
                                        <div className="text-[10px] opacity-75">Ultra 4K</div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setScaleFactor(-1)}
                                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                                            scaleFactor === -1
                                                ? "bg-primary text-white border-primary shadow-md shadow-primary/25 font-bold"
                                                : "bg-surface/80 hover:bg-surface border-border/70 text-foreground/80 hover:text-foreground font-semibold"
                                        }`}
                                    >
                                        <div className="text-sm font-black">Kustom</div>
                                        <div className="text-[10px] opacity-75">{customScale}×</div>
                                    </button>
                                </div>

                                {scaleFactor === -1 && (
                                    <div className="pt-2 px-1 space-y-1.5">
                                        <div className="flex justify-between text-xs text-foreground/70">
                                            <span>Skala Kustom:</span>
                                            <span className="font-bold text-primary">{customScale}×</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={1.5}
                                            max={6}
                                            step={0.5}
                                            value={customScale}
                                            onChange={(e) => setCustomScale(parseFloat(e.target.value))}
                                            className="w-full accent-primary cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[10px] text-foreground/40">
                                            <span>1.5×</span>
                                            <span>3×</span>
                                            <span>6×</span>
                                        </div>
                                    </div>
                                )}

                                {activeItem && (
                                    <div className="p-2.5 rounded-xl bg-surface/70 border border-border/60 text-center text-xs text-foreground/70">
                                        Resolusi Hasil:{" "}
                                        <strong className="text-emerald-400 font-bold">
                                            {Math.round(activeItem.width * effectiveScale)} × {Math.round(activeItem.height * effectiveScale)} px
                                        </strong>
                                    </div>
                                )}
                            </div>

                            {/* Mode Preset Selector */}
                            <div className="space-y-2.5">
                                <label className="text-xs font-bold text-foreground">
                                    Mode & Karakter Gambar
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {UPSCALE_MODES.map((m) => {
                                        const isSelected = mode === m.id;
                                        const IconComponent = m.icon;
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => handleModeChange(m.id)}
                                                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                                    isSelected
                                                        ? "bg-surface border-primary ring-2 ring-primary/30 shadow-md"
                                                        : "bg-surface/60 hover:bg-surface border-border/70"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${m.color}`}>
                                                        <IconComponent size={13} />
                                                    </div>
                                                    <span className={`text-xs font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                                                        {m.label}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-foreground/50 line-clamp-2 leading-tight">
                                                    {m.desc}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Fine-Tuning Sliders */}
                            <div className="space-y-3.5 pt-1 border-t border-border/60">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-foreground">Penyesuaian Ketajaman & Kualitas</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const preset = UPSCALE_MODES.find((m) => m.id === mode);
                                            if (preset) {
                                                setSharpness(preset.defaultSharpness);
                                                setDenoise(preset.defaultDenoise);
                                                setClarity(preset.defaultClarity);
                                            }
                                        }}
                                        className="text-[10px] text-primary hover:underline cursor-pointer"
                                    >
                                        Reset Slider
                                    </button>
                                </div>

                                {/* Slider Ketajaman */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-foreground/70">Ketajaman Tepi (Sharpness):</span>
                                        <span className="font-bold text-foreground">{sharpness}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={sharpness}
                                        onChange={(e) => setSharpness(parseInt(e.target.value))}
                                        className="w-full accent-primary cursor-pointer"
                                    />
                                </div>

                                {/* Slider Denoise */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-foreground/70">Pembersih Noise / JPEG:</span>
                                        <span className="font-bold text-foreground">{denoise}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={denoise}
                                        onChange={(e) => setDenoise(parseInt(e.target.value))}
                                        className="w-full accent-primary cursor-pointer"
                                    />
                                </div>

                                {/* Slider Clarity */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-foreground/70">Kejernihan & Kontras:</span>
                                        <span className="font-bold text-foreground">{clarity}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={clarity}
                                        onChange={(e) => setClarity(parseInt(e.target.value))}
                                        className="w-full accent-primary cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Output Format Selection */}
                            <div className="space-y-2 pt-1 border-t border-border/60">
                                <label className="text-xs font-bold text-foreground">
                                    Format Unduhan
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["image/png", "image/jpeg", "image/webp"] as const).map((fmt) => {
                                        const label = fmt === "image/png" ? "PNG (Lossless)" : fmt === "image/jpeg" ? "JPG" : "WebP";
                                        const isSelected = outputFormat === fmt;
                                        return (
                                            <button
                                                key={fmt}
                                                type="button"
                                                onClick={() => setOutputFormat(fmt)}
                                                className={`py-2 px-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                                                    isSelected
                                                        ? "bg-primary text-white border-primary shadow-xs"
                                                        : "bg-surface/70 hover:bg-surface border-border/70 text-foreground/70 hover:text-foreground"
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Main CTA Button */}
                            <div className="pt-2 space-y-2">
                                <button
                                    type="button"
                                    onClick={() => processSingleImage(activeIdx)}
                                    disabled={activeItem?.status === "processing" || isProcessingBatch}
                                    className="w-full py-3.5 px-4 rounded-2xl bg-primary hover:bg-primary-focus disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    {activeItem?.status === "processing" ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Sedang Memproses...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} className="text-amber-300" />
                                            <span>Tingkatkan Resolusi ({effectiveScale}×)</span>
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
                                        <Layers size={14} className="text-purple-400" />
                                        <span>Proses Semua ({images.length} Foto)</span>
                                    </button>
                                )}

                                {/* Download All ZIP Button if at least 1 is done */}
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

            {/* Media Lightbox Modal for 400% Zoom Inspection */}
            <MediaLightboxModal
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                item={activeLightboxItem}
                accentColor="purple"
                downloadLabel="Unduh Hasil HD"
                onDownload={() => activeItem && handleDownloadSingle(activeItem)}
            />
        </div>
    );
}
