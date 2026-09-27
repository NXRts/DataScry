"use client";

import React, { useState, useEffect, useRef } from "react";
import Dropzone from "@/components/ui/Dropzone";
import { removeBackground } from "@imgly/background-removal";
import JSZip from "jszip";
import {
    Eraser,
    Sparkles,
    Download,
    RotateCcw,
    FolderOpen,
    Eye,
    CheckCircle2,
    AlertCircle,
    X,
    FileArchive,
    Sliders,
    Layers,
    Palette,
    Check,
    Loader2
} from "lucide-react";
import MediaLightboxModal, { LightboxItem } from "@/components/shared/MediaLightboxModal";
import RemoveBgComparisonSlider from "@/components/tools/RemoveBgComparisonSlider";

interface ImageItem {
    id: string;
    file: File;
    name: string;
    size: number;
    originalUrl: string;
    width: number;
    height: number;
    resultBlob?: Blob;
    resultUrl?: string;
    status: "idle" | "processing" | "done" | "error";
    progress: number;
    progressStep: string;
    error?: string;
}

const BACKDROP_PRESETS = [
    { label: "Transparan", value: "transparent", colorCode: "transparent", isChecker: true },
    { label: "Putih", value: "#FFFFFF", colorCode: "#FFFFFF", border: true },
    { label: "Merah Pas Foto", value: "#DC2626", colorCode: "#DC2626" },
    { label: "Biru Pas Foto", value: "#2563EB", colorCode: "#2563EB" },
    { label: "Hitam", value: "#111827", colorCode: "#111827" },
    { label: "Abu Netral", value: "#64748B", colorCode: "#64748B" },
    { label: "Kuning Pastel", value: "#FDE047", colorCode: "#FDE047" },
    { label: "Hijau Emerald", value: "#10B981", colorCode: "#10B981" },
];

const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ClientRemoveBackground() {
    const [images, setImages] = useState<ImageItem[]>([]);
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [selectedBackdrop, setSelectedBackdrop] = useState<string>("transparent");
    const [customColor, setCustomColor] = useState<string>("#8B5CF6");
    const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Lightbox Modal for 400% Zoom & Pan Inspection
    const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeTaskIdRef = useRef<string | null>(null);
    const cancelRequestedRef = useRef<boolean>(false);
    const activeTickerRef = useRef<NodeJS.Timeout | null>(null);
    const currentQueueIdRef = useRef<number>(0);

    // Intercept model fetches to cache them in browser CacheStorage (localStorage/Cache API)
    useEffect(() => {
        if (typeof window !== "undefined" && "caches" in window) {
            const originalFetch = window.fetch;
            window.fetch = async (input, init) => {
                const url = typeof input === "string" ? input : input instanceof Request ? input.url : input.toString();
                if (url.includes("/api/bg-removal/")) {
                    try {
                        const cache = await caches.open("datascry-bg-removal-cache");
                        const cachedResponse = await cache.match(input);
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        const networkResponse = await originalFetch(input, init);
                        if (networkResponse.ok) {
                            cache.put(input, networkResponse.clone()).catch(() => {});
                        }
                        return networkResponse;
                    } catch (e) {
                        return originalFetch(input, init);
                    }
                }
                return originalFetch(input, init);
            };

            return () => {
                window.fetch = originalFetch;
            };
        }
    }, []);

    // Clean up created object URLs on unmount or file reset
    useEffect(() => {
        return () => {
            images.forEach((item) => {
                if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
                if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
            });
        };
    }, []);

    const getImageData = (file: File): Promise<{ width: number; height: number; previewUrl: string }> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewUrl = (e.target?.result as string) || "";
                const img = new Image();
                img.onload = () => {
                    resolve({
                        width: img.naturalWidth || 1920,
                        height: img.naturalHeight || 1080,
                        previewUrl,
                    });
                };
                img.onerror = () => {
                    resolve({ width: 1920, height: 1080, previewUrl });
                };
                img.src = previewUrl;
            };
            reader.onerror = () => {
                const blobUrl = URL.createObjectURL(file);
                resolve({ width: 1920, height: 1080, previewUrl: blobUrl });
            };
            reader.readAsDataURL(file);
        });
    };

    const handleFilesAccepted = async (acceptedFiles: File[]) => {
        const imageFiles = acceptedFiles.filter((f) => f.type.startsWith("image/"));
        if (imageFiles.length === 0) {
            setErrorMessage("Silakan pilih berkas gambar yang valid (JPG, PNG, WebP).");
            return;
        }

        setErrorMessage(null);

        const newItems: ImageItem[] = [];
        for (const file of imageFiles) {
            const { width, height, previewUrl } = await getImageData(file);
            newItems.push({
                id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                file,
                name: file.name,
                size: file.size,
                originalUrl: previewUrl,
                width,
                height,
                status: "idle",
                progress: 0,
                progressStep: "Siap diproses",
            });
        }

        setImages((prev) => {
            const updated = [...prev, ...newItems];
            // Immediately focus active view on the new image being processed
            const nextIdx = prev.length;
            setActiveIndex(nextIdx);
            return updated;
        });

        // Trigger processing
        processPendingQueue(newItems);
    };

    const processSingleImage = async (item: ImageItem): Promise<ImageItem> => {
        activeTaskIdRef.current = item.id;
        cancelRequestedRef.current = false;
        const startTime = Date.now();

        let currentProgress = 12;
        let currentStep = "Menginisialisasi engine AI lokal...";

        const stopInferenceTicker = () => {
            if (activeTickerRef.current) {
                clearInterval(activeTickerRef.current);
                activeTickerRef.current = null;
            }
        };

        const updateItemProgress = (pct: number, stepText?: string) => {
            if (cancelRequestedRef.current || activeTaskIdRef.current !== item.id) return;
            // Strictly monotonic: progress can only go forward, never jump backwards
            currentProgress = Math.min(99, Math.max(currentProgress, pct));
            if (stepText) currentStep = stepText;

            setImages((prev) =>
                prev.map((img) =>
                    img.id === item.id
                        ? { ...img, status: "processing", progress: currentProgress, progressStep: currentStep }
                        : img
                )
            );
        };

        // Smooth prep ticker: glides from 12% to 42% while engine initializes or verifies cache
        const startPrepTicker = () => {
            stopInferenceTicker();
            updateItemProgress(12, "Menginisialisasi engine AI lokal...");
            activeTickerRef.current = setInterval(() => {
                if (cancelRequestedRef.current || activeTaskIdRef.current !== item.id) {
                    stopInferenceTicker();
                    return;
                }
                const elapsed = Date.now() - startTime;
                if (currentProgress < 42) {
                    const next = Math.min(42, Math.round(12 + (elapsed / 1000) * 28));
                    let step = "Menginisialisasi engine AI & memori lokal...";
                    if (next >= 28) step = "Memuat bobot model neural network...";
                    updateItemProgress(next, step);
                }
            }, 80);
        };

        const startInferenceTicker = () => {
            stopInferenceTicker();
            const inferenceStart = Date.now();
            updateItemProgress(52, "AI menganalisis kontur dan komposisi subjek...");

            activeTickerRef.current = setInterval(() => {
                if (cancelRequestedRef.current || activeTaskIdRef.current !== item.id) {
                    stopInferenceTicker();
                    return;
                }
                const elapsed = Date.now() - inferenceStart;
                // Smooth asymptotic curve towards 88% over ~2.5 seconds of WASM inference
                const boost = (88 - 52) * (1 - Math.exp(-elapsed / 1600));
                const newPct = Math.round(52 + boost);

                let dynamicStep = "AI mengekstrak subjek & helai rambut...";
                if (newPct >= 72) {
                    dynamicStep = "Menghaluskan segmentasi transparansi...";
                }

                updateItemProgress(newPct, dynamicStep);
            }, 80);
        };

        // Initialize progress state and start prep ticker immediately
        startPrepTicker();

        let wasmBytes = 0;
        let modelBytes = 0;
        const totalExpectedBytes = 95 * 1024 * 1024; // Expected total size for model + wasm runtime

        const handleImglyProgress = (key: string, current: number, total: number) => {
            if (cancelRequestedRef.current || activeTaskIdRef.current !== item.id) return;

            if (key.includes("fetch")) {
                if (key.includes("wasm") || key.includes("mjs")) {
                    wasmBytes = current;
                } else {
                    modelBytes = current;
                }
                const totalDownloaded = wasmBytes + modelBytes;
                const fetchFraction = Math.min(0.98, totalDownloaded / totalExpectedBytes);
                const fetchPct = 15 + Math.round(fetchFraction * 33); // Maps 15% -> 48%
                updateItemProgress(fetchPct, `Menyiapkan model AI (${Math.round(fetchFraction * 100)}%)...`);
            } else if (key === "compute:decode") {
                stopInferenceTicker();
                updateItemProgress(48, "Menganalisis piksel & format gambar...");
            } else if (key === "compute:inference") {
                startInferenceTicker();
            } else if (key === "compute:mask") {
                stopInferenceTicker();
                updateItemProgress(90, "Menghaluskan tepi & transparansi subjek...");
            } else if (key === "compute:encode") {
                stopInferenceTicker();
                updateItemProgress(96, "Mengemas hasil HD Lossless PNG...");
            }
        };

        try {
            const publicPath = typeof window !== "undefined"
                ? `${window.location.origin}/api/bg-removal/`
                : "/api/bg-removal/";

            let resultBlob: Blob;
            try {
                resultBlob = await removeBackground(item.file, {
                    publicPath,
                    model: "isnet_fp16", // High-fidelity FP16 model
                    rescale: true, // Upscales alpha matte to 100% original dimensions
                    output: {
                        format: "image/png",
                        quality: 1.0, // Lossless HD PNG
                    },
                    proxyToWorker: true, // Non-blocking Web Worker execution
                    progress: handleImglyProgress,
                });
            } catch (modelErr) {
                console.warn("Model isnet_fp16 gagal atau kekurangan memori, mencoba model alternatif isnet_quint8...", modelErr);
                updateItemProgress(currentProgress, "Beralih ke model optimasi cepat...");
                resultBlob = await removeBackground(item.file, {
                    publicPath,
                    model: "isnet_quint8", // Quantized fast fallback model
                    rescale: true,
                    output: {
                        format: "image/png",
                        quality: 1.0,
                    },
                    proxyToWorker: true,
                    progress: handleImglyProgress,
                });
            }

            stopInferenceTicker();

            if (cancelRequestedRef.current || activeTaskIdRef.current !== item.id) {
                return item;
            }

            // Smooth visual pacing: ensure user sees the AI scanline and progress glide smoothly for at least 2.2 seconds
            const elapsed = Date.now() - startTime;
            if (elapsed < 2200) {
                updateItemProgress(98, "Menyempurnakan detail akhir...");
                await new Promise((r) => setTimeout(r, 2200 - elapsed));
            }

            updateItemProgress(100, "Selesai (HD Lossless)");
            await new Promise((r) => setTimeout(r, 350));

            if (cancelRequestedRef.current || activeTaskIdRef.current !== item.id) {
                return item;
            }

            const resultUrl = URL.createObjectURL(resultBlob);

            const updated: ImageItem = {
                ...item,
                resultBlob,
                resultUrl,
                status: "done",
                progress: 100,
                progressStep: "Selesai (HD Lossless)",
            };

            setImages((prev) => prev.map((img) => (img.id === item.id ? updated : img)));
            return updated;
        } catch (err: any) {
            stopInferenceTicker();
            if (cancelRequestedRef.current || activeTaskIdRef.current !== item.id) {
                return item;
            }
            console.error("Gagal menghapus latar belakang:", err);
            const failedItem: ImageItem = {
                ...item,
                status: "error",
                progress: 0,
                progressStep: "Gagal memproses",
                error: err?.message || "Terjadi kendala saat memproses gambar.",
            };
            setImages((prev) => prev.map((img) => (img.id === item.id ? failedItem : img)));
            return failedItem;
        }
    };

    const processPendingQueue = async (itemsToProcess: ImageItem[]) => {
        const queueId = Date.now();
        currentQueueIdRef.current = queueId;
        cancelRequestedRef.current = false;
        setIsProcessingBatch(true);

        for (const item of itemsToProcess) {
            if (currentQueueIdRef.current !== queueId || cancelRequestedRef.current) break;

            // Ensure the active workspace view displays the item currently being processed
            setImages((prev) => {
                const idx = prev.findIndex((img) => img.id === item.id);
                if (idx !== -1) setActiveIndex(idx);
                return prev;
            });

            await processSingleImage(item);
        }

        if (currentQueueIdRef.current === queueId) {
            setIsProcessingBatch(false);
        }
    };

    const handleClearAll = () => {
        // Cancel active tasks and tickers
        cancelRequestedRef.current = true;
        activeTaskIdRef.current = null;
        if (activeTickerRef.current) {
            clearInterval(activeTickerRef.current);
            activeTickerRef.current = null;
        }

        images.forEach((item) => {
            if (item.originalUrl && item.originalUrl.startsWith("blob:")) URL.revokeObjectURL(item.originalUrl);
            if (item.resultUrl && item.resultUrl.startsWith("blob:")) URL.revokeObjectURL(item.resultUrl);
        });

        setImages([]);
        setActiveIndex(0);
        setErrorMessage(null);
        setIsProcessingBatch(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleRemoveItem = (id: string) => {
        setImages((prev) => {
            const target = prev.find((img) => img.id === id);
            if (target) {
                if (target.originalUrl && target.originalUrl.startsWith("blob:")) URL.revokeObjectURL(target.originalUrl);
                if (target.resultUrl && target.resultUrl.startsWith("blob:")) URL.revokeObjectURL(target.resultUrl);
            }
            const nextList = prev.filter((img) => img.id !== id);
            if (activeIndex >= nextList.length) {
                setActiveIndex(Math.max(0, nextList.length - 1));
            }
            return nextList;
        });
    };

    const activeImage = images[activeIndex] || null;

    // Download single image with current backdrop selection
    const handleDownloadSingle = async (item: ImageItem) => {
        if (!item.resultUrl || !item.resultBlob) return;

        const baseName = item.name.replace(/\.[^/.]+$/, "");

        // If transparent, download original PNG lossless
        if (selectedBackdrop === "transparent") {
            const a = document.createElement("a");
            a.href = item.resultUrl;
            a.download = `${baseName}-cutout-datascry.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return;
        }

        // If custom background color, render to canvas at 100% full original resolution
        const canvas = document.createElement("canvas");
        canvas.width = item.width;
        canvas.height = item.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = selectedBackdrop;
        ctx.fillRect(0, 0, item.width, item.height);

        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = item.resultUrl!;
        });

        ctx.drawImage(img, 0, 0, item.width, item.height);

        canvas.toBlob(
            (blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${baseName}-backdrop-datascry.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            },
            "image/png",
            1.0
        );
    };

    // Download all processed images as ZIP
    const handleDownloadAllZip = async () => {
        const completedImages = images.filter((img) => img.status === "done" && img.resultBlob);
        if (completedImages.length === 0) return;

        const zip = new JSZip();

        for (const item of completedImages) {
            const baseName = item.name.replace(/\.[^/.]+$/, "");

            if (selectedBackdrop === "transparent") {
                zip.file(`${baseName}-cutout-datascry.png`, item.resultBlob!);
            } else {
                // Render with backdrop color
                const canvas = document.createElement("canvas");
                canvas.width = item.width;
                canvas.height = item.height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.fillStyle = selectedBackdrop;
                    ctx.fillRect(0, 0, item.width, item.height);

                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    await new Promise((resolve) => {
                        img.onload = resolve;
                        img.src = item.resultUrl!;
                    });

                    ctx.drawImage(img, 0, 0, item.width, item.height);
                    const coloredBlob = await new Promise<Blob | null>((res) =>
                        canvas.toBlob((b) => res(b), "image/png", 1.0)
                    );
                    if (coloredBlob) {
                        zip.file(`${baseName}-backdrop-datascry.png`, coloredBlob);
                    }
                }
            }
        }

        const zipContent = await zip.generateAsync({ type: "blob" });
        const zipUrl = URL.createObjectURL(zipContent);
        const a = document.createElement("a");
        a.href = zipUrl;
        a.download = "Hasil-Hapus-Latar-DataScry.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(zipUrl);
    };

    // Lightbox item for inspecting full quality
    const activeLightboxItem: LightboxItem | null = activeImage?.resultUrl
        ? {
              url: activeImage.resultUrl,
              title: `${activeImage.name} (Hasil Cutout HD)`,
              width: activeImage.width,
              height: activeImage.height,
              aspectRatio: `${activeImage.width}×${activeImage.height} px`,
          }
        : null;

    return (
        <div className="space-y-8 w-full">
            {/* Hidden file input for adding more files */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        handleFilesAccepted(Array.from(e.target.files));
                    }
                }}
            />

            {/* In-App Error Banner */}
            {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-2.5">
                        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        <span className="text-sm font-medium">{errorMessage}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setErrorMessage(null)}
                        className="text-rose-400 hover:text-rose-200 transition-colors p-1"
                        aria-label="Tutup notifikasi"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {images.length === 0 ? (
                <div className="animate-fade-in">
                    <Dropzone
                        onFilesAccepted={handleFilesAccepted}
                        accept="image/*"
                        title="Tarik & Letakkan Foto ke Sini"
                        description="Mendukung foto potret, manusia, produk e-commerce, hewan, dan tanda tangan. Diproses 100% lokal di browser Anda dengan hasil tajam HD."
                        icons={
                            <div className="flex items-center gap-2 text-emerald-400 font-bold">
                                <Eraser className="w-5 h-5" />
                                <span>Foto JPG, PNG, atau WebP</span>
                            </div>
                        }
                    />
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    {/* Header Controls Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface/60 border border-border/60 backdrop-blur-md shadow-sm">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                                <Eraser className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-base sm:text-lg text-foreground truncate max-w-xs sm:max-w-md">
                                    {activeImage?.name || "Foto Terpilih"}
                                </span>
                                <div className="flex items-center gap-2 text-xs text-foreground/60 mt-0.5">
                                    <span className="text-emerald-400 font-semibold">
                                        {activeImage ? `${activeImage.width} × ${activeImage.height} px (HD Asli)` : ""}
                                    </span>
                                    <span>•</span>
                                    <span>{images.length} Foto dalam Antrean</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-foreground/80 hover:text-rose-400 bg-surface hover:bg-rose-500/10 border border-border/80 hover:border-rose-500/30 rounded-xl transition-all active:scale-95 cursor-pointer"
                                title="Hapus semua berkas dan reset antrean"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Clear Semua</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                                title="Tambah foto lain ke antrean"
                            >
                                <FolderOpen className="w-4 h-4" />
                                <span>Tambah Foto</span>
                            </button>
                        </div>
                    </div>

                    {/* Multi-image thumbnail selection row (if > 1 image) */}
                    {images.length > 1 && (
                        <div className="glass-panel p-3 rounded-2xl border border-border/60 overflow-x-auto flex items-center gap-3">
                            {images.map((img, idx) => (
                                <button
                                    key={img.id}
                                    type="button"
                                    onClick={() => setActiveIndex(idx)}
                                    className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                                        activeIndex === idx
                                            ? "border-emerald-500 ring-2 ring-emerald-500/20 scale-105"
                                            : "border-border/60 opacity-60 hover:opacity-100"
                                    }`}
                                >
                                    <img
                                        src={img.resultUrl || img.originalUrl}
                                        alt={img.name}
                                        className="w-full h-full object-cover rounded-none"
                                    />
                                    {img.status === "processing" && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                                            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                                        </div>
                                    )}
                                    {img.status === "done" && (
                                        <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                            <Check className="w-2.5 h-2.5" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Main Active Image Workspace */}
                    {activeImage && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left 2 Cols: Comparison Slider or Processing Spinner */}
                            <div className="lg:col-span-2 space-y-4">
                                {activeImage.status === "processing" ? (
                                    <div className="relative rounded-3xl overflow-hidden border border-emerald-500/20 bg-surface/60 shadow-2xl flex flex-col items-center justify-center min-h-115 p-6 sm:p-10 group">
                                        {/* Subtle Ambient Radial Glow */}
                                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />

                                        {/* Center Futuristic AI Processing Card */}
                                        <div className="relative z-10 flex flex-col items-center justify-center space-y-6 w-full max-w-md">
                                            {/* Glowing AI Icon Hub */}
                                            <div className="relative flex items-center justify-center">
                                                <div className="absolute w-24 h-24 rounded-full bg-emerald-500/15 blur-xl animate-pulse" />
                                                <div className="relative w-20 h-20 rounded-2xl bg-zinc-950/90 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                                                    <div className="relative">
                                                        <Eraser className="w-9 h-9 text-emerald-400" />
                                                        <Sparkles className="w-4 h-4 text-teal-300 absolute -top-1.5 -right-1.5 animate-spin" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Selected File Details Badge */}
                                            <div className="text-center space-y-2">
                                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold shadow-sm">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                    </span>
                                                    <span className="truncate max-w-50 sm:max-w-xs">{activeImage.name}</span>
                                                </div>
                                                <div className="flex items-center justify-center gap-2 text-xs text-foreground/50 font-medium">
                                                    <span className="font-mono text-emerald-400 font-semibold">{activeImage.width} × {activeImage.height} px</span>
                                                    <span>•</span>
                                                    <span>{formatBytes(activeImage.size)}</span>
                                                    <span>•</span>
                                                    <span className="text-foreground/70">HD Lossless</span>
                                                </div>
                                            </div>

                                            {/* Progress Card */}
                                            <div className="w-full p-4 sm:p-5 rounded-2xl bg-zinc-950/85 backdrop-blur-xl border border-emerald-500/25 shadow-xl space-y-3.5">
                                                <div className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2 text-foreground font-medium min-w-0">
                                                        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
                                                        <span className="truncate text-xs font-medium text-emerald-100">
                                                            {activeImage.progressStep}
                                                        </span>
                                                    </div>
                                                    <span className="font-mono font-bold text-emerald-400 text-sm shrink-0 ml-2">
                                                        {activeImage.progress}%
                                                    </span>
                                                </div>

                                                <div className="w-full bg-surface/90 rounded-full h-2.5 overflow-hidden border border-border/80 p-0.5 shadow-inner">
                                                    <div
                                                        className="bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-150 ease-out shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                                                        style={{ width: `${Math.max(6, activeImage.progress)}%` }}
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between text-[11px] text-foreground/45 pt-1 border-t border-border/40">
                                                    <span>On-Device Neural Engine</span>
                                                    <span className="text-emerald-400/80 font-medium">100% Privat Lokal</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : activeImage.status === "done" && activeImage.resultUrl ? (
                                    <div className="space-y-3">
                                        <RemoveBgComparisonSlider
                                            originalUrl={activeImage.originalUrl}
                                            resultUrl={activeImage.resultUrl}
                                            backdropColor={selectedBackdrop}
                                            altText={activeImage.name}
                                        />
                                        <div className="flex items-center justify-between text-xs text-foreground/60 px-1">
                                            <span className="italic">
                                                💡 Geser pemisah putih di tengah untuk membandingkan sebelum dan sesudah.
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setIsLightboxOpen(true)}
                                                className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>Inspeksi HD (Zoom & Pan)</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : activeImage.status === "error" ? (
                                    <div className="p-8 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-center space-y-4">
                                        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
                                        <h4 className="font-bold text-rose-300 text-lg">Gagal Memproses Gambar</h4>
                                        <p className="text-xs text-foreground/70">{activeImage.error}</p>
                                        <button
                                            type="button"
                                            onClick={() => processPendingQueue([activeImage])}
                                            className="px-5 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-all cursor-pointer"
                                        >
                                            Coba Lagi
                                        </button>
                                    </div>
                                ) : (
                                    <div className="glass-panel p-12 rounded-3xl border border-border/80 flex flex-col items-center justify-center text-center space-y-4 min-h-87.5">
                                        <img
                                            src={activeImage.originalUrl}
                                            alt={activeImage.name}
                                            className="max-h-60 rounded-xl object-contain"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => processPendingQueue([activeImage])}
                                            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-600/30 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            <span>Mulai Hapus Latar Belakang</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Right 1 Col: Backdrop Customizer & Actions */}
                            <div className="space-y-6">
                                {/* Backdrop Selector Card */}
                                <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-border/80 shadow-xl space-y-4">
                                    <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
                                        <Palette className="w-5 h-5 text-emerald-400" />
                                        <h3 className="font-bold text-sm sm:text-base text-foreground">
                                            Ganti Latar Belakang
                                        </h3>
                                    </div>

                                    {/* Presets Grid */}
                                    <div className="grid grid-cols-4 gap-2.5">
                                        {BACKDROP_PRESETS.map((preset) => {
                                            const isSelected = selectedBackdrop === preset.value;
                                            return (
                                                <button
                                                    key={preset.value}
                                                    type="button"
                                                    onClick={() => setSelectedBackdrop(preset.value)}
                                                    className={`group relative p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                                                        isSelected
                                                            ? "bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30 scale-105"
                                                            : "bg-surface/50 border-border/70 hover:bg-surface"
                                                    }`}
                                                    title={preset.label}
                                                >
                                                    <div
                                                        className={`w-7 h-7 rounded-lg shadow-inner ${
                                                            preset.border ? "border border-border" : ""
                                                        }`}
                                                        style={{
                                                            backgroundColor: preset.isChecker
                                                                ? "transparent"
                                                                : preset.colorCode,
                                                            backgroundImage: preset.isChecker
                                                                ? "repeating-conic-gradient(#525252 0% 25%, #262626 0% 50%) 50% / 8px 8px"
                                                                : "none",
                                                        }}
                                                    />
                                                    <span className="text-[10px] font-semibold text-foreground/80 truncate w-full text-center">
                                                        {preset.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Custom Color Input */}
                                    <div className="pt-2 flex items-center justify-between gap-3 border-t border-border/40">
                                        <label className="text-xs font-semibold text-foreground/70">
                                            Warna Kustom (Hex):
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={customColor}
                                                onChange={(e) => {
                                                    setCustomColor(e.target.value);
                                                    setSelectedBackdrop(e.target.value);
                                                }}
                                                className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent"
                                                title="Pilih warna kustom"
                                            />
                                            <span className="text-xs font-mono text-foreground/60 uppercase">
                                                {selectedBackdrop.startsWith("#") ? selectedBackdrop : customColor}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quality Badge Guarantee */}
                                <div className="p-4 rounded-2xl bg-surface/50 border border-border/70 flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div className="text-xs space-y-0.5">
                                        <p className="font-bold text-foreground">Garansi Kualitas HD 1:1</p>
                                        <p className="text-foreground/60">
                                            Piksel asli tidak di-downscale. Format ekspor PNG mempertahankan ketajaman 100%.
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-3 pt-2">
                                    {activeImage.status === "done" && (
                                        <button
                                            type="button"
                                            onClick={() => handleDownloadSingle(activeImage)}
                                            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2.5 text-sm sm:text-base"
                                        >
                                            <Download className="w-5 h-5" />
                                            <span>
                                                {selectedBackdrop === "transparent"
                                                    ? "Unduh PNG Transparan HD"
                                                    : "Unduh dengan Latar Terpilih"}
                                            </span>
                                        </button>
                                    )}

                                    {images.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={handleDownloadAllZip}
                                            className="w-full py-3.5 rounded-2xl bg-surface hover:bg-surface/80 border border-border text-foreground font-semibold text-xs sm:text-sm transition-all hover:scale-[1.01] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                                        >
                                            <FileArchive className="w-4 h-4 text-emerald-400" />
                                            <span>Unduh Semua Hasil (.ZIP)</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Media Lightbox Modal for 400% Zoom & Pan Inspection */}
            <MediaLightboxModal
                isOpen={isLightboxOpen}
                item={activeLightboxItem}
                onClose={() => setIsLightboxOpen(false)}
                accentColor="emerald"
            />
        </div>
    );
}
