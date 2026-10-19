"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Dropzone from "@/components/ui/Dropzone";
import JSZip from "jszip";
import {
    RotateCw,
    RotateCcw,
    FlipHorizontal,
    FlipVertical,
    Download,
    CheckCircle2,
    Loader2,
    FolderArchive,
    Sliders,
    Eye,
    AlertCircle,
    X,
    Layers,
    FileImage,
    Check,
    ZoomIn,
    Trash2,
    Sparkles,
    Undo2,
    Plus,
    RefreshCw,
    ShieldCheck
} from "lucide-react";
import MediaLightboxModal, { LightboxItem } from "@/components/shared/MediaLightboxModal";
import {
    rotateImage,
    normalizeRotation,
    RotateOptions
} from "@/lib/imageRotator";

interface ImageItem {
    id: string;
    file: File;
    name: string;
    size: number;
    type: string;
    url: string;
    width: number;
    height: number;
    rotation: number; // 0, 90, 180, 270
    flipH: boolean;
    flipV: boolean;
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

const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ClientRotateImage() {
    // Images State
    const [images, setImages] = useState<ImageItem[]>([]);
    const [activeIdx, setActiveIdx] = useState<number>(0);
    const [isLoadingImages, setIsLoadingImages] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Output Settings
    const [outputFormat, setOutputFormat] = useState<"original" | "image/jpeg" | "image/png" | "image/webp">("original");
    const [outputQuality, setOutputQuality] = useState<number>(92); // 10 - 100

    // Processing & Zip State
    const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
    const [isZipping, setIsZipping] = useState<boolean>(false);

    // Fullscreen Lightbox
    const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
    const [lightboxPreviewUrl, setLightboxPreviewUrl] = useState<string | null>(null);
    const [lightboxTitle, setLightboxTitle] = useState<string>("");

    const addFilesInputRef = useRef<HTMLInputElement>(null);
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

    // Helper: Read image dimensions from file
    const readFileMetadata = (file: File): Promise<{ width: number; height: number; url: string }> => {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.naturalWidth || img.width,
                    height: img.naturalHeight || img.height,
                    url,
                });
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error(`Gagal memuat berkas gambar ${file.name}`));
            };
            img.src = url;
        });
    };

    // Handle files accepted via Dropzone or File Input
    const handleFiles = useCallback(async (files: File[]) => {
        if (!files || files.length === 0) return;

        setIsLoadingImages(true);
        setErrorMessage(null);

        const validImages = files.filter(
            (f) => f.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|avif|bmp|gif|svg)$/i.test(f.name)
        );

        if (validImages.length === 0) {
            setErrorMessage("Silakan pilih file gambar yang valid (JPG, PNG, WebP, AVIF, BMP).");
            setIsLoadingImages(false);
            return;
        }

        try {
            const loadedItems: ImageItem[] = [];

            for (let i = 0; i < validImages.length; i++) {
                const f = validImages[i];
                try {
                    const meta = await readFileMetadata(f);
                    loadedItems.push({
                        id: `rot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                        file: f,
                        name: f.name,
                        size: f.size,
                        type: f.type || "image/jpeg",
                        url: meta.url,
                        width: meta.width,
                        height: meta.height,
                        rotation: 0,
                        flipH: false,
                        flipV: false,
                        status: "idle",
                        progress: 0,
                    });
                } catch (err) {
                    console.error("Skip invalid image:", f.name, err);
                }
            }

            if (loadedItems.length === 0) {
                setErrorMessage("Tidak ada gambar valid yang dapat dimuat.");
            } else {
                setImages((prev) => [...prev, ...loadedItems]);
                setActiveIdx((prev) => (prev >= 0 && prev < prev + loadedItems.length ? prev : 0));
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat membaca file.";
            setErrorMessage(msg);
        } finally {
            setIsLoadingImages(false);
        }
    }, []);

    // Rotate single item by delta degrees (+90 or -90 or 180)
    const rotateSingleItem = (id: string, delta: number) => {
        setImages((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;
                const newRotation = normalizeRotation(item.rotation + delta);
                return {
                    ...item,
                    rotation: newRotation,
                    status: "idle",
                    resultBlob: undefined,
                    resultUrl: undefined,
                };
            })
        );
    };

    // Flip single item
    const toggleFlipSingleItem = (id: string, axis: "h" | "v") => {
        setImages((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;
                return {
                    ...item,
                    flipH: axis === "h" ? !item.flipH : item.flipH,
                    flipV: axis === "v" ? !item.flipV : item.flipV,
                    status: "idle",
                    resultBlob: undefined,
                    resultUrl: undefined,
                };
            })
        );
    };

    // Reset single item
    const resetSingleItem = (id: string) => {
        setImages((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;
                return {
                    ...item,
                    rotation: 0,
                    flipH: false,
                    flipV: false,
                    status: "idle",
                    resultBlob: undefined,
                    resultUrl: undefined,
                };
            })
        );
    };

    // Remove single item
    const removeSingleItem = (id: string) => {
        setImages((prev) => {
            const target = prev.find((img) => img.id === id);
            if (target?.url) URL.revokeObjectURL(target.url);
            if (target?.resultUrl) URL.revokeObjectURL(target.resultUrl);
            const next = prev.filter((img) => img.id !== id);
            return next;
        });
        setActiveIdx((curr) => Math.max(0, curr - 1));
    };

    // Batch Action: Rotate ALL items
    const rotateAllItems = (delta: number) => {
        setImages((prev) =>
            prev.map((item) => ({
                ...item,
                rotation: normalizeRotation(item.rotation + delta),
                status: "idle",
                resultBlob: undefined,
                resultUrl: undefined,
            }))
        );
    };

    // Batch Action: Flip ALL items
    const toggleFlipAllItems = (axis: "h" | "v") => {
        setImages((prev) =>
            prev.map((item) => ({
                ...item,
                flipH: axis === "h" ? !item.flipH : item.flipH,
                flipV: axis === "v" ? !item.flipV : item.flipV,
                status: "idle",
                resultBlob: undefined,
                resultUrl: undefined,
            }))
        );
    };

    // Batch Action: Reset ALL items
    const resetAllItems = () => {
        setImages((prev) =>
            prev.map((item) => ({
                ...item,
                rotation: 0,
                flipH: false,
                flipV: false,
                status: "idle",
                resultBlob: undefined,
                resultUrl: undefined,
            }))
        );
    };

    // Batch Action: Clear ALL images
    const clearAll = () => {
        images.forEach((img) => {
            if (img.url) URL.revokeObjectURL(img.url);
            if (img.resultUrl) URL.revokeObjectURL(img.resultUrl);
        });
        setImages([]);
        setActiveIdx(0);
        setErrorMessage(null);
    };

    // Calculate effective rotated dimensions
    const getEffectiveDimensions = (w: number, h: number, rot: number) => {
        const isSideways = rot === 90 || rot === 270;
        return {
            width: isSideways ? h : w,
            height: isSideways ? w : h,
        };
    };

    // Process a single image item through Canvas 2D
    const processSingleImage = async (item: ImageItem): Promise<ImageItem> => {
        const options: RotateOptions = {
            rotation: item.rotation,
            flipHorizontal: item.flipH,
            flipVertical: item.flipV,
            format: outputFormat,
            quality: outputQuality,
        };

        const result = await rotateImage(item.file, options);

        return {
            ...item,
            status: "done",
            progress: 100,
            resultBlob: result.blob,
            resultUrl: result.url,
            resultWidth: result.width,
            resultHeight: result.height,
            resultSize: result.size,
            durationMs: result.durationMs,
        };
    };

    // Process all images in batch
    const handleProcessAll = async () => {
        if (images.length === 0 || isProcessingBatch) return;

        setIsProcessingBatch(true);
        setErrorMessage(null);

        // Mark all as processing
        setImages((prev) =>
            prev.map((img) => ({
                ...img,
                status: "processing",
                progress: 10,
            }))
        );

        const updated: ImageItem[] = [];

        for (let i = 0; i < images.length; i++) {
            const currentItem = images[i];
            try {
                const res = await processSingleImage(currentItem);
                updated.push(res);
                setImages((prev) =>
                    prev.map((item, idx) => (idx === i ? res : item))
                );
            } catch (err: unknown) {
                const errorText = err instanceof Error ? err.message : "Gagal memproses rotasi.";
                const failedItem: ImageItem = {
                    ...currentItem,
                    status: "error",
                    error: errorText,
                };
                updated.push(failedItem);
                setImages((prev) =>
                    prev.map((item, idx) => (idx === i ? failedItem : item))
                );
            }
        }

        setIsProcessingBatch(false);
    };

    // Helper: Determine download file extension
    const getTargetExtension = (item: ImageItem): string => {
        if (outputFormat === "image/jpeg") return "jpg";
        if (outputFormat === "image/png") return "png";
        if (outputFormat === "image/webp") return "webp";
        const parts = item.name.split(".");
        return parts.length > 1 ? parts.pop()!.toLowerCase() : "jpg";
    };

    // Download single processed image
    const handleDownloadSingle = async (item: ImageItem) => {
        let blobToDownload = item.resultBlob;
        let urlToDownload = item.resultUrl;

        // If not processed yet, process on the fly
        if (!blobToDownload || !urlToDownload) {
            try {
                const processed = await processSingleImage(item);
                blobToDownload = processed.resultBlob;
                urlToDownload = processed.resultUrl;
                setImages((prev) =>
                    prev.map((img) => (img.id === item.id ? processed : img))
                );
            } catch (err) {
                console.error("Gagal memproses gambar sebelum unduh:", err);
                return;
            }
        }

        if (!urlToDownload) return;

        const ext = getTargetExtension(item);
        const baseName = item.name.replace(/\.[^/.]+$/, "");
        const cleanName = `${baseName}-terputar.${ext}`;

        const a = document.createElement("a");
        a.href = urlToDownload;
        a.download = cleanName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Download ALL as ZIP
    const handleDownloadZip = async () => {
        if (images.length === 0 || isZipping) return;

        setIsZipping(true);
        setErrorMessage(null);

        try {
            const zip = new JSZip();

            for (let i = 0; i < images.length; i++) {
                const item = images[i];
                let blob = item.resultBlob;

                // Process if not processed yet
                if (!blob) {
                    const processed = await processSingleImage(item);
                    blob = processed.resultBlob;
                    setImages((prev) =>
                        prev.map((img) => (img.id === item.id ? processed : img))
                    );
                }

                if (blob) {
                    const ext = getTargetExtension(item);
                    const baseName = item.name.replace(/\.[^/.]+$/, "");
                    const fileName = `${String(i + 1).padStart(2, "0")}_${baseName}-terputar.${ext}`;
                    zip.file(fileName, blob);
                }
            }

            const zipBlob = await zip.generateAsync({
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: { level: 6 },
            });

            const zipUrl = URL.createObjectURL(zipBlob);
            const a = document.createElement("a");
            a.href = zipUrl;
            a.download = `datascry-putar-gambar-${new Date().toISOString().slice(0, 10)}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(zipUrl);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Gagal mengemas berkas ke ZIP.";
            setErrorMessage(msg);
        } finally {
            setIsZipping(false);
        }
    };

    // Lightbox item for MediaLightboxModal
    const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null);

    // Open Lightbox
    const handleOpenLightbox = (item: ImageItem) => {
        const dims = getEffectiveDimensions(item.width, item.height, item.rotation);
        setLightboxItem({
            url: item.resultUrl || item.url,
            title: item.name,
            width: dims.width,
            height: dims.height,
            size: item.resultSize || item.size,
            mimeType: item.type,
            aspectRatio: `${dims.width} / ${dims.height}`,
        });
        setIsLightboxOpen(true);
    };

    return (
        <div className="space-y-6 sm:space-y-8 animate-fade-in">
            {/* Error Message Toast */}
            {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{errorMessage}</span>
                    </div>
                    <button
                        onClick={() => setErrorMessage(null)}
                        className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Empty State: Dropzone */}
            {images.length === 0 ? (
                <div className="space-y-4">
                    <Dropzone
                        onFilesAccepted={handleFiles}
                        accept="image/*"
                        color="sky"
                        title="Tarik & Letakkan Foto untuk Diputar atau Dibalik (Flip)"
                        description="Mendukung JPG, PNG, WebP, AVIF, dan BMP. Putar 90°, 180°, atau cermin mirror secara massal 100% lokal di browser Anda."
                    />

                    {/* Feature Highlights Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div className="p-4 rounded-2xl bg-surface/50 border border-border/70 space-y-1.5 text-center sm:text-left">
                            <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto sm:mx-0">
                                <RotateCw size={16} />
                            </div>
                            <h4 className="text-xs font-bold text-foreground">Rotasi Presisi 90° & 180°</h4>
                            <p className="text-[11px] text-foreground/60 leading-relaxed">
                                Putar per foto atau terapkan ke puluhan dokumen sekaligus searah atau berlawanan jarum jam.
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-surface/50 border border-border/70 space-y-1.5 text-center sm:text-left">
                            <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto sm:mx-0">
                                <FlipHorizontal size={16} />
                            </div>
                            <h4 className="text-xs font-bold text-foreground">Cermin Mirror (Flip H & V)</h4>
                            <p className="text-[11px] text-foreground/60 leading-relaxed">
                                Balik foto selfie kamera depan yang terbalik atau buat efek cermin artistik seketika.
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-surface/50 border border-border/70 space-y-1.5 text-center sm:text-left">
                            <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto sm:mx-0">
                                <ShieldCheck size={16} />
                            </div>
                            <h4 className="text-xs font-bold text-foreground">100% Bebas Server</h4>
                            <p className="text-[11px] text-foreground/60 leading-relaxed">
                                Seluruh gambar diproses langsung di memori perangkat via Canvas 2D. Sangat aman dan privat.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                /* Workspace State */
                <div className="space-y-6">
                    {/* Top Batch Action Toolbar */}
                    <div className="glass-panel p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-border/80 flex flex-wrap items-center justify-between gap-3 shadow-xl">
                        {/* Summary Info */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                                <Layers className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                                    <span>{images.length} Foto Siap Diputar</span>
                                    <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[11px]">
                                        Batch
                                    </span>
                                </h3>
                                <p className="text-xs text-foreground/60">
                                    Total ukuran berkas:{" "}
                                    <strong className="text-foreground/80">
                                        {formatBytes(images.reduce((acc, f) => acc + f.size, 0))}
                                    </strong>
                                </p>
                            </div>
                        </div>

                        {/* Global Fast Actions */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            {/* Hidden file input for adding more files */}
                            <input
                                ref={addFilesInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                title=""
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files) handleFiles(Array.from(e.target.files));
                                    e.target.value = "";
                                }}
                            />

                            <button
                                type="button"
                                onClick={() => addFilesInputRef.current?.click()}
                                className="px-3 py-1.5 rounded-xl border border-border/80 bg-surface/80 hover:bg-surface text-foreground font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
                                title="Tambah foto lain ke antrean"
                            >
                                <Plus className="w-3.5 h-3.5 text-sky-400" />
                                <span>Tambah Foto</span>
                            </button>

                            {/* Rotate All 90° CCW */}
                            <button
                                type="button"
                                onClick={() => rotateAllItems(-90)}
                                className="px-3 py-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                title="Putar semua foto 90° berlawanan jarum jam"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Semua -90°</span>
                                <span className="sm:hidden">-90°</span>
                            </button>

                            {/* Rotate All 90° CW */}
                            <button
                                type="button"
                                onClick={() => rotateAllItems(90)}
                                className="px-3 py-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                title="Putar semua foto 90° searah jarum jam"
                            >
                                <RotateCw className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Semua +90°</span>
                                <span className="sm:hidden">+90°</span>
                            </button>

                            {/* Flip All Horizontal */}
                            <button
                                type="button"
                                onClick={() => toggleFlipAllItems("h")}
                                className="px-3 py-1.5 rounded-xl border border-border/80 bg-surface/80 hover:bg-surface text-foreground font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                title="Cermin balik horizontal semua foto"
                            >
                                <FlipHorizontal className="w-3.5 h-3.5 text-sky-400" />
                                <span className="hidden md:inline">Cermin Semua</span>
                            </button>

                            {/* Reset All */}
                            <button
                                type="button"
                                onClick={resetAllItems}
                                className="px-3 py-1.5 rounded-xl border border-border/80 bg-surface/80 hover:bg-surface text-foreground/70 hover:text-foreground font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                title="Reset orientasi semua foto ke 0° semula"
                            >
                                <Undo2 className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Reset</span>
                            </button>

                            {/* Clear All */}
                            <button
                                type="button"
                                onClick={clearAll}
                                className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                title="Hapus semua foto dari antrean"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Hapus Semua</span>
                            </button>
                        </div>
                    </div>

                    {/* Output & Format Settings Bar */}
                    <div className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/80 space-y-4 shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
                            <div className="flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-sky-400" />
                                <h4 className="text-sm font-bold text-foreground">Pengaturan Format & Kualitas Output</h4>
                            </div>
                            <div className="text-xs text-foreground/50">
                                Berlaku otomatis untuk semua gambar saat diunduh
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Format Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground/80 flex items-center justify-between">
                                    <span>Format Berkas Output</span>
                                    <span className="text-sky-400 font-bold uppercase text-[10px]">
                                        {outputFormat === "original" ? "Sesuai Asli" : outputFormat.replace("image/", "")}
                                    </span>
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { id: "original", label: "Sama Asli" },
                                        { id: "image/jpeg", label: "JPG" },
                                        { id: "image/png", label: "PNG" },
                                        { id: "image/webp", label: "WebP" }
                                    ].map((fmt) => (
                                        <button
                                            key={fmt.id}
                                            type="button"
                                            onClick={() => setOutputFormat(fmt.id as "original" | "image/jpeg" | "image/png" | "image/webp")}
                                            className={`py-2 px-1 text-center rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                                outputFormat === fmt.id
                                                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/25 ring-2 ring-sky-400"
                                                    : "bg-surface/80 border border-border/80 text-foreground/70 hover:text-foreground hover:bg-surface"
                                            }`}
                                        >
                                            {fmt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quality Slider (for JPG & WebP) */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-foreground/80">
                                        Kualitas Kompresi (JPG/WebP)
                                    </label>
                                    <span className="text-sky-400 font-black text-xs">
                                        {outputQuality}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={20}
                                    max={100}
                                    step={1}
                                    value={outputQuality}
                                    onChange={(e) => setOutputQuality(Number(e.target.value))}
                                    className="w-full accent-sky-500 cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-foreground/50">
                                    <span>Hemat Ruang (20%)</span>
                                    <span>Standar (80-90%)</span>
                                    <span>Kualitas Penuh (100%)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Interactive Grid: Image Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {images.map((img, idx) => {
                            const dims = getEffectiveDimensions(img.width, img.height, img.rotation);
                            const isRotatedOrFlipped = img.rotation !== 0 || img.flipH || img.flipV;

                            return (
                                <div
                                    key={img.id}
                                    onClick={() => setActiveIdx(idx)}
                                    className={`group relative glass-panel rounded-2xl sm:rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col ${
                                        activeIdx === idx
                                            ? "border-sky-500/60 shadow-xl shadow-sky-500/10 ring-2 ring-sky-500/30"
                                            : "border-border/80 hover:border-sky-500/30 hover:shadow-lg"
                                    }`}
                                >
                                    {/* Card Header Info */}
                                    <div className="p-3.5 border-b border-border/40 flex items-center justify-between gap-2 bg-surface/40">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-5 h-5 rounded-lg bg-surface border border-border/70 text-foreground/60 text-[10px] font-bold flex items-center justify-center shrink-0">
                                                {idx + 1}
                                            </span>
                                            <span className="text-xs font-bold text-foreground truncate max-w-36 sm:max-w-44">
                                                {img.name}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeSingleItem(img.id);
                                            }}
                                            className="p-1 rounded-lg text-foreground/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                            title="Hapus foto ini"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Thumbnail Preview Area with CSS Transform Matrix */}
                                    <div className="relative aspect-4/3 bg-black/40 overflow-hidden flex items-center justify-center p-3 select-none">
                                        {/* Orientation Badges */}
                                        <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1">
                                            {img.rotation !== 0 && (
                                                <span className="px-2 py-0.5 rounded-md bg-sky-500/90 text-white font-extrabold text-[10px] shadow-sm backdrop-blur-xs">
                                                    {img.rotation}°
                                                </span>
                                            )}
                                            {img.flipH && (
                                                <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/90 text-white font-bold text-[10px] shadow-sm backdrop-blur-xs">
                                                    Flip H
                                                </span>
                                            )}
                                            {img.flipV && (
                                                <span className="px-1.5 py-0.5 rounded-md bg-purple-500/90 text-white font-bold text-[10px] shadow-sm backdrop-blur-xs">
                                                    Flip V
                                                </span>
                                            )}
                                            {!isRotatedOrFlipped && (
                                                <span className="px-1.5 py-0.5 rounded-md bg-surface/80 text-foreground/60 border border-border/60 text-[10px]">
                                                    Normal (0°)
                                                </span>
                                            )}
                                        </div>

                                        {/* Status Badge */}
                                        {img.status === "done" && (
                                            <div className="absolute top-2 right-2 z-10">
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-md">
                                                    <Check className="w-3 h-3" /> Siap
                                                </span>
                                            </div>
                                        )}

                                        {/* Live Transformed Image Thumbnail */}
                                        <div className="w-full h-full flex items-center justify-center overflow-hidden">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={img.url}
                                                alt={img.name}
                                                style={{
                                                    transform: `rotate(${img.rotation}deg) scaleX(${img.flipH ? -1 : 1}) scaleY(${img.flipV ? -1 : 1})`,
                                                    transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                                    maxWidth: "92%",
                                                    maxHeight: "92%",
                                                }}
                                                className="object-contain drop-shadow-md rounded-xs"
                                            />
                                        </div>

                                        {/* Lightbox Zoom Icon Button on Card */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenLightbox(img);
                                            }}
                                            className="absolute bottom-2 right-2 p-1.5 rounded-xl bg-black/60 hover:bg-sky-500 text-white transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg"
                                            title="Pratinjau Fullscreen Zoom"
                                        >
                                            <ZoomIn className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Dimensions & Size Metadata */}
                                    <div className="px-3.5 py-2.5 bg-surface/30 border-t border-border/40 text-[11px] text-foreground/70 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <FileImage className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                            <span className="font-semibold text-foreground/90">
                                                {dims.width} × {dims.height} px
                                            </span>
                                        </div>
                                        <span>{formatBytes(img.resultSize || img.size)}</span>
                                    </div>

                                    {/* Action Button Controls for This Card */}
                                    <div className="p-3 bg-surface/60 border-t border-border/40 grid grid-cols-5 gap-1">
                                        {/* Rotate CCW */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                rotateSingleItem(img.id, -90);
                                            }}
                                            className="py-1.5 rounded-xl border border-border/80 bg-surface hover:bg-sky-500/15 hover:border-sky-500/40 hover:text-sky-400 text-foreground font-semibold flex items-center justify-center transition-all cursor-pointer"
                                            title="Putar -90° Berlawanan Jam"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Rotate CW */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                rotateSingleItem(img.id, 90);
                                            }}
                                            className="py-1.5 rounded-xl border border-border/80 bg-surface hover:bg-sky-500/15 hover:border-sky-500/40 hover:text-sky-400 text-foreground font-semibold flex items-center justify-center transition-all cursor-pointer"
                                            title="Putar +90° Searah Jam"
                                        >
                                            <RotateCw className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Flip H */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFlipSingleItem(img.id, "h");
                                            }}
                                            className={`py-1.5 rounded-xl border font-semibold flex items-center justify-center transition-all cursor-pointer ${
                                                img.flipH
                                                    ? "bg-indigo-500 text-white border-indigo-400 shadow-xs"
                                                    : "border-border/80 bg-surface hover:bg-sky-500/15 hover:text-sky-400 text-foreground"
                                            }`}
                                            title="Cermin Horizontal (Mirror)"
                                        >
                                            <FlipHorizontal className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Flip V */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFlipSingleItem(img.id, "v");
                                            }}
                                            className={`py-1.5 rounded-xl border font-semibold flex items-center justify-center transition-all cursor-pointer ${
                                                img.flipV
                                                    ? "bg-purple-500 text-white border-purple-400 shadow-xs"
                                                    : "border-border/80 bg-surface hover:bg-sky-500/15 hover:text-sky-400 text-foreground"
                                            }`}
                                            title="Balik Vertikal"
                                        >
                                            <FlipVertical className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Download This Image */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownloadSingle(img);
                                            }}
                                            className="py-1.5 rounded-xl border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white font-semibold flex items-center justify-center transition-all cursor-pointer shadow-xs"
                                            title="Unduh foto ini sekarang"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom Primary Action Bar */}
                    <div className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                        <div className="space-y-0.5 text-center sm:text-left">
                            <h4 className="text-sm font-bold text-foreground">
                                Siap Mengekspor {images.length} Berkas?
                            </h4>
                            <p className="text-xs text-foreground/60">
                                Gambar diproses 100% lokal di browser Anda dengan kualitas resolusi tinggi.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 w-full sm:w-auto">
                            {/* Process All Button */}
                            <button
                                type="button"
                                onClick={handleProcessAll}
                                disabled={isProcessingBatch}
                                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-surface border border-border/80 hover:bg-surface/90 text-foreground font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
                            >
                                {isProcessingBatch ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                                        <span>Memproses Rotasi...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 text-sky-400" />
                                        <span>Proses Semua Berkas</span>
                                    </>
                                )}
                            </button>

                            {/* Download All as ZIP */}
                            <button
                                type="button"
                                onClick={handleDownloadZip}
                                disabled={isZipping || isProcessingBatch}
                                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-linear-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg shadow-sky-500/25 disabled:opacity-50"
                            >
                                {isZipping ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Mengemas ZIP...</span>
                                    </>
                                ) : (
                                    <>
                                        <FolderArchive className="w-4 h-4" />
                                        <span>Unduh Semua (.ZIP)</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox Modal (Zoom 50% - 400% & Pan) */}
            <MediaLightboxModal
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                item={lightboxItem}
                accentColor="blue"
                downloadLabel="Unduh Foto Ini"
                onDownload={() => {
                    const target = images.find((img) => img.name === lightboxItem?.title);
                    if (target) handleDownloadSingle(target);
                }}
            />
        </div>
    );
}
