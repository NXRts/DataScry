"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Dropzone from "@/components/ui/Dropzone";
import JSZip from "jszip";
import {
    ArrowLeftRight,
    Download,
    RotateCcw,
    Sparkles,
    Sliders,
    Eye,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Loader2,
    FolderArchive,
    Image as ImageIcon,
    FileImage,
    Plus,
    Palette,
    Layers,
    Check,
    HardDrive
} from "lucide-react";
import MediaLightboxModal, { LightboxItem } from "@/components/shared/MediaLightboxModal";

type TargetFormat = "jpeg" | "png" | "webp" | "avif";
type ScaleOption = 100 | 75 | 50 | 25;

interface ImageItem {
    id: string;
    file: File;
    previewUrl: string;
    originalFormat: string;
    originalWidth: number;
    originalHeight: number;
    originalSize: number;
    status: "idle" | "processing" | "success" | "error";
    outputBlob?: Blob;
    outputUrl?: string;
    outputSize?: number;
    outputWidth?: number;
    outputHeight?: number;
    outputFileName?: string;
    errorMsg?: string;
}

const PRESETS = [
    {
        id: "webp-to-jpg",
        name: "WebP ke JPG (CPNS & BUMN)",
        desc: "Format universal untuk portal resmi, latar putih bersih",
        format: "jpeg" as TargetFormat,
        quality: 92,
        scale: 100 as ScaleOption,
        fillBg: true,
        bgColor: "#ffffff"
    },
    {
        id: "to-png",
        name: "Ke PNG (Lossless & Transparan)",
        desc: "Resolusi tajam tanpa kompresi, pertahankan transparansi",
        format: "png" as TargetFormat,
        quality: 100,
        scale: 100 as ScaleOption,
        fillBg: false,
        bgColor: "#ffffff"
    },
    {
        id: "to-webp",
        name: "Optimasi Web (Ke WebP)",
        desc: "Format modern Google, hemat 30-40% ukuran file",
        format: "webp" as TargetFormat,
        quality: 85,
        scale: 100 as ScaleOption,
        fillBg: false,
        bgColor: "#ffffff"
    },
    {
        id: "compact-webp",
        name: "WebP Ringan (Hemat Kuota)",
        desc: "Kompresi tinggi untuk pratinjau cepat & chat",
        format: "webp" as TargetFormat,
        quality: 70,
        scale: 75 as ScaleOption,
        fillBg: false,
        bgColor: "#ffffff"
    }
];

export default function ClientConvertImage() {
    const [images, setImages] = useState<ImageItem[]>([]);
    const [targetFormat, setTargetFormat] = useState<TargetFormat>("jpeg");
    const [quality, setQuality] = useState<number>(90);
    const [scale, setScale] = useState<ScaleOption>(100);
    const [fillBg, setFillBg] = useState<boolean>(true);
    const [bgColor, setBgColor] = useState<string>("#ffffff");
    const [activePreset, setActivePreset] = useState<string>("webp-to-jpg");
    const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
    const [batchProgress, setBatchProgress] = useState<number>(0);
    const [isZipping, setIsZipping] = useState<boolean>(false);
    const [avifSupported, setAvifSupported] = useState<boolean>(false);
    const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null);

    const objectUrlsRef = useRef<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Deteksi dukungan AVIF di browser client
    useEffect(() => {
        try {
            const canvas = document.createElement("canvas");
            canvas.width = 1;
            canvas.height = 1;
            canvas.toBlob((blob) => {
                if (blob && blob.type === "image/avif") {
                    setAvifSupported(true);
                }
            }, "image/avif");
        } catch {
            setAvifSupported(false);
        }
    }, []);

    // Cleanup blob URLs saat komponen di-unmount
    useEffect(() => {
        const urls = objectUrlsRef.current;
        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url));
            urls.clear();
        };
    }, []);

    // Format byte helper
    const formatBytes = (bytes: number) => {
        if (!bytes || bytes <= 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    // Ekstrak ekstensi berkas
    const getFileExt = (fileName: string) => {
        const ext = fileName.split(".").pop();
        return ext ? ext.toUpperCase() : "IMG";
    };

    // Cek apakah format asal sama dengan target format
    const isSameFormat = useCallback((originalFormat: string, target: TargetFormat): boolean => {
        const orig = (originalFormat || "").trim().toLowerCase();
        if (target === "jpeg") {
            return orig === "jpg" || orig === "jpeg";
        }
        if (target === "png") {
            return orig === "png";
        }
        if (target === "webp") {
            return orig === "webp";
        }
        if (target === "avif") {
            return orig === "avif";
        }
        return false;
    }, []);

    // Cek apakah SEMUA gambar dalam antrean sudah berformat target tertentu
    const isFormatDisabled = useCallback(
        (target: TargetFormat): boolean => {
            if (images.length === 0) return false;
            return images.every((img) => isSameFormat(img.originalFormat, target));
        },
        [images, isSameFormat]
    );

    // Auto-switch target format jika semua gambar di antrean sudah berformat targetFormat saat ini
    useEffect(() => {
        if (images.length === 0) return;
        const allSame = images.every((img) => isSameFormat(img.originalFormat, targetFormat));
        if (allSame) {
            const candidates: TargetFormat[] = ["webp", "jpeg", "png", "avif"];
            const available = candidates.find((fmt) => {
                if (fmt === "avif" && !avifSupported) return false;
                return !images.every((img) => isSameFormat(img.originalFormat, fmt));
            });
            if (available) {
                setTargetFormat(available);
                setActivePreset("");
            }
        }
    }, [images, targetFormat, avifSupported, isSameFormat]);

    // Baca metadata gambar (dimensi)
    const readImageMetadata = (file: File): Promise<{ width: number; height: number }> => {
        return new Promise((resolve) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                resolve({ width: img.naturalWidth, height: img.naturalHeight });
                URL.revokeObjectURL(url);
            };
            img.onerror = () => {
                resolve({ width: 0, height: 0 });
                URL.revokeObjectURL(url);
            };
            img.src = url;
        });
    };

    // Tambah berkas ke antrean
    const handleFilesAccepted = async (acceptedFiles: File[]) => {
        const imageFiles = acceptedFiles.filter((f) => f.type.startsWith("image/"));
        if (imageFiles.length === 0) return;

        const newItems: ImageItem[] = await Promise.all(
            imageFiles.map(async (file) => {
                const previewUrl = URL.createObjectURL(file);
                objectUrlsRef.current.add(previewUrl);
                const { width, height } = await readImageMetadata(file);

                return {
                    id: Math.random().toString(36).substring(2, 9),
                    file,
                    previewUrl,
                    originalFormat: getFileExt(file.name),
                    originalWidth: width,
                    originalHeight: height,
                    originalSize: file.size,
                    status: "idle"
                };
            })
        );

        setImages((prev) => [...prev, ...newItems]);
    };

    // Eksekusi konversi 1 gambar menggunakan HTML5 Canvas
    const convertImageProcess = async (
        item: ImageItem,
        format: TargetFormat,
        qual: number,
        scl: number,
        bgFillOption: boolean,
        bgColorVal: string
    ): Promise<Partial<ImageItem>> => {
        return new Promise((resolve) => {
            const img = new Image();
            const tempUrl = URL.createObjectURL(item.file);

            img.onload = () => {
                URL.revokeObjectURL(tempUrl);
                try {
                    const origW = img.naturalWidth;
                    const origH = img.naturalHeight;
                    const targetW = Math.max(1, Math.round((origW * scl) / 100));
                    const targetH = Math.max(1, Math.round((origH * scl) / 100));

                    const canvas = document.createElement("canvas");
                    canvas.width = targetW;
                    canvas.height = targetH;
                    const ctx = canvas.getContext("2d", { willReadFrequently: true });

                    if (!ctx) {
                        resolve({ status: "error", errorMsg: "Canvas context tidak tersedia" });
                        return;
                    }

                    // Isi background jika format JPEG atau jika user mengaktifkan latar warna pada format selain PNG
                    if (format === "jpeg" || (bgFillOption && format !== "png")) {
                        ctx.fillStyle = bgColorVal || "#ffffff";
                        ctx.fillRect(0, 0, targetW, targetH);
                    }

                    ctx.drawImage(img, 0, 0, targetW, targetH);

                    const mime =
                        format === "jpeg"
                            ? "image/jpeg"
                            : format === "png"
                            ? "image/png"
                            : format === "webp"
                            ? "image/webp"
                            : "image/avif";

                    const qualityArg = format === "png" ? undefined : Math.min(1, Math.max(0.01, qual / 100));

                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                resolve({ status: "error", errorMsg: "Gagal memproses ekspor kanvas" });
                                return;
                            }

                            const outputUrl = URL.createObjectURL(blob);
                            objectUrlsRef.current.add(outputUrl);

                            const originalName = item.file.name;
                            const baseName = originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
                            const ext = format === "jpeg" ? "jpg" : format;
                            const outputFileName = `${baseName}.${ext}`;

                            resolve({
                                status: "success",
                                outputBlob: blob,
                                outputUrl,
                                outputSize: blob.size,
                                outputWidth: targetW,
                                outputHeight: targetH,
                                outputFileName,
                                originalWidth: origW,
                                originalHeight: origH
                            });
                        },
                        mime,
                        qualityArg
                    );
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : "Kesalahan proses kanvas";
                    resolve({ status: "error", errorMsg: msg });
                }
            };

            img.onerror = () => {
                URL.revokeObjectURL(tempUrl);
                resolve({ status: "error", errorMsg: "Gagal memuat gambar ke memori" });
            };

            img.src = tempUrl;
        });
    };

    // Konversi semua gambar (hanya memproses gambar yang formatnya berbeda dengan target)
    const handleConvertAll = async () => {
        if (images.length === 0 || isProcessingBatch) return;

        const convertibleIndices: number[] = [];
        images.forEach((img, idx) => {
            if (!isSameFormat(img.originalFormat, targetFormat)) {
                convertibleIndices.push(idx);
            }
        });

        if (convertibleIndices.length === 0) return;

        setIsProcessingBatch(true);
        setBatchProgress(0);

        const total = convertibleIndices.length;
        const updatedImages = [...images];

        for (let step = 0; step < total; step++) {
            const i = convertibleIndices[step];
            // Tandai sedang diproses
            updatedImages[i] = { ...updatedImages[i], status: "processing" };
            setImages([...updatedImages]);

            const result = await convertImageProcess(
                updatedImages[i],
                targetFormat,
                quality,
                scale,
                fillBg,
                bgColor
            );

            // Bersihkan URL blob output lama jika ada
            if (updatedImages[i].outputUrl) {
                URL.revokeObjectURL(updatedImages[i].outputUrl!);
                objectUrlsRef.current.delete(updatedImages[i].outputUrl!);
            }

            updatedImages[i] = {
                ...updatedImages[i],
                ...result
            };

            setImages([...updatedImages]);
            setBatchProgress(Math.round(((step + 1) / total) * 100));
        }

        setIsProcessingBatch(false);
    };

    // Konversi 1 gambar tertentu
    const handleConvertSingle = async (id: string) => {
        const index = images.findIndex((img) => img.id === id);
        if (index === -1) return;

        const targetItem = images[index];
        // Cegah jika berkas sudah berformat sama persis dengan target
        if (isSameFormat(targetItem.originalFormat, targetFormat)) return;

        setImages((prev) =>
            prev.map((item, i) => (i === index ? { ...item, status: "processing" } : item))
        );

        const result = await convertImageProcess(targetItem, targetFormat, quality, scale, fillBg, bgColor);

        if (targetItem.outputUrl) {
            URL.revokeObjectURL(targetItem.outputUrl);
            objectUrlsRef.current.delete(targetItem.outputUrl);
        }

        setImages((prev) =>
            prev.map((item, i) => (i === index ? { ...item, ...result } : item))
        );
    };

    // Terapkan preset
    const applyPreset = (presetId: string) => {
        const p = PRESETS.find((item) => item.id === presetId);
        if (!p) return;
        setActivePreset(presetId);
        setTargetFormat(p.format);
        setQuality(p.quality);
        setScale(p.scale);
        setFillBg(p.fillBg);
        setBgColor(p.bgColor);
    };

    // Unduh berkas tunggal
    const handleDownloadSingle = (item: ImageItem) => {
        if (!item.outputBlob || !item.outputFileName) return;
        const url = URL.createObjectURL(item.outputBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = item.outputFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    // Unduh semua berkas sebagai ZIP
    const handleDownloadAllZip = async () => {
        const successItems = images.filter((img) => img.status === "success" && img.outputBlob);
        if (successItems.length === 0 || isZipping) return;

        setIsZipping(true);
        try {
            const zip = new JSZip();
            successItems.forEach((img) => {
                if (img.outputBlob && img.outputFileName) {
                    zip.file(img.outputFileName, img.outputBlob);
                }
            });

            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const a = document.createElement("a");
            a.href = url;
            a.download = `datascry-converted-images-${targetFormat}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1500);
        } catch (err) {
            console.error("Gagal membuat zip:", err);
        } finally {
            setIsZipping(false);
        }
    };

    // Hapus 1 berkas
    const handleRemoveItem = (id: string) => {
        const item = images.find((img) => img.id === id);
        if (item) {
            URL.revokeObjectURL(item.previewUrl);
            objectUrlsRef.current.delete(item.previewUrl);
            if (item.outputUrl) {
                URL.revokeObjectURL(item.outputUrl);
                objectUrlsRef.current.delete(item.outputUrl);
            }
        }
        setImages((prev) => prev.filter((img) => img.id !== id));
    };

    // Bersihkan semua (Clean Reset)
    const handleClearAll = () => {
        images.forEach((img) => {
            URL.revokeObjectURL(img.previewUrl);
            if (img.outputUrl) URL.revokeObjectURL(img.outputUrl);
        });
        objectUrlsRef.current.clear();
        setImages([]);
        setBatchProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Buka Lightbox Modal
    const handleOpenLightbox = (item: ImageItem) => {
        const isConverted = item.status === "success" && item.outputUrl;
        const activeUrl = isConverted ? item.outputUrl! : item.previewUrl;
        const activeWidth = isConverted ? item.outputWidth : item.originalWidth;
        const activeHeight = isConverted ? item.outputHeight : item.originalHeight;
        const activeSize = isConverted ? item.outputSize : item.originalSize;
        const titleText = isConverted ? item.outputFileName || item.file.name : item.file.name;

        setLightboxItem({
            url: activeUrl,
            title: titleText,
            width: activeWidth,
            height: activeHeight,
            size: activeSize
        });
    };

    // Statistik HUD
    const stats = useMemo(() => {
        const totalCount = images.length;
        const totalOrigSize = images.reduce((acc, curr) => acc + curr.originalSize, 0);
        const convertedItems = images.filter((img) => img.status === "success" && img.outputSize);
        const convertedCount = convertedItems.length;
        const totalOutputSize = convertedItems.reduce((acc, curr) => acc + (curr.outputSize || 0), 0);

        let savingsPercent = 0;
        if (convertedCount > 0) {
            const correspondingOrigSize = convertedItems.reduce((acc, curr) => acc + curr.originalSize, 0);
            if (correspondingOrigSize > 0) {
                savingsPercent = Math.round(
                    ((correspondingOrigSize - totalOutputSize) / correspondingOrigSize) * 100
                );
            }
        }

        return {
            totalCount,
            totalOrigSize,
            convertedCount,
            totalOutputSize,
            savingsPercent
        };
    }, [images]);

    // Jumlah gambar yang format aslinya berbeda dari targetFormat (dapat dikonversi)
    const convertibleCount = useMemo(() => {
        return images.filter((img) => !isSameFormat(img.originalFormat, targetFormat)).length;
    }, [images, targetFormat, isSameFormat]);

    return (
        <div className="space-y-8">
            {/* Input State: Dropzone */}
            {images.length === 0 ? (
                <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-border/80 shadow-xl space-y-6">
                    <Dropzone
                        onFilesAccepted={handleFilesAccepted}
                        accept="image/*"
                        title="Tarik & Lepas Gambar ke Sini"
                        description="Mendukung WebP, JPG, PNG, AVIF, GIF, BMP, SVG. Konversi ribuan foto dalam hitungan detik 100% lokal di browser Anda."
                        icons={<ArrowLeftRight className="w-12 h-12 text-amber-500 animate-pulse" />}
                    />

                    {/* Fitur Sorotan Bawah */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/60">
                        <div className="p-4 rounded-2xl bg-surface/40 border border-border/50 space-y-1">
                            <p className="text-xs font-bold text-amber-400">⚡ Solusi Berkas WebP</p>
                            <p className="text-xs text-foreground/60 leading-relaxed">
                                Ubah berkas WebP unduhan internet menjadi JPG standar untuk formulir CPNS, BUMN, & sekolah.
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-surface/40 border border-border/50 space-y-1">
                            <p className="text-xs font-bold text-emerald-400">🛡️ Latar Putih Anti-Hitam</p>
                            <p className="text-xs text-foreground/60 leading-relaxed">
                                Transparansi PNG otomatis diisi latar putih bersih saat diubah ke JPG, bebas area hitam pekat.
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-surface/40 border border-border/50 space-y-1">
                            <p className="text-xs font-bold text-fuchsia-400">📦 Ekspor Sekaligus (ZIP)</p>
                            <p className="text-xs text-foreground/60 leading-relaxed">
                                Unduh hasil konversi satu per satu atau kemas puluhan foto menjadi satu arsip ZIP siap pakai.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                /* Active State: Workspace */
                <div className="space-y-6">
                    {/* Control Panel Glass */}
                    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-border/80 shadow-2xl space-y-6">
                        {/* Header Action Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-5">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                                    <Sliders className="w-5 h-5 text-amber-500" />
                                    Pengaturan Target Format & Kualitas
                                </h2>
                                <p className="text-xs text-foreground/60 mt-0.5">
                                    {images.length} gambar siap dikonfigurasi dan diproses
                                </p>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-surface border border-border/70 hover:bg-surface/80 hover:border-amber-500/40 cursor-pointer transition-all">
                                    <Plus className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Tambah Gambar</span>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                handleFilesAccepted(Array.from(e.target.files));
                                            }
                                        }}
                                    />
                                </label>
                                <button
                                    onClick={handleClearAll}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 cursor-pointer transition-all"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Hapus Semua</span>
                                </button>
                            </div>
                        </div>

                        {/* Presets Grid */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-foreground/50">
                                Preset Cepat Instan
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                {PRESETS.map((p) => {
                                    const isSelected = activePreset === p.id;
                                    const isPresetDisabled = isFormatDisabled(p.format);
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => !isPresetDisabled && applyPreset(p.id)}
                                            disabled={isPresetDisabled}
                                            className={`p-3 rounded-2xl text-left border transition-all ${
                                                isPresetDisabled
                                                    ? "opacity-40 cursor-not-allowed bg-surface/30 border-border/40 text-foreground/40"
                                                    : isSelected
                                                    ? "bg-amber-500/15 border-amber-500/60 shadow-md shadow-amber-500/10 cursor-pointer"
                                                    : "bg-surface/50 border-border/60 hover:bg-surface hover:border-border cursor-pointer"
                                            }`}
                                            title={isPresetDisabled ? `Semua berkas sudah berformat .${p.format === "jpeg" ? "jpg" : p.format}` : p.name}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold text-foreground">{p.name}</p>
                                                {isSelected && !isPresetDisabled && <Check className="w-3.5 h-3.5 text-amber-400" />}
                                                {isPresetDisabled && (
                                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-surface border border-border text-foreground/50 font-medium">
                                                        Sudah .{p.format === "jpeg" ? "jpg" : p.format}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-foreground/60 mt-1 leading-snug">{p.desc}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Main Settings Form */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                            {/* 1. Format Target */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-foreground/50 flex items-center justify-between">
                                    <span>Format Output</span>
                                    <span className="text-[10px] text-amber-400 font-mono">
                                        .{targetFormat === "jpeg" ? "jpg" : targetFormat}
                                    </span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => {
                                            if (!isFormatDisabled("jpeg")) {
                                                setTargetFormat("jpeg");
                                                setActivePreset("");
                                            }
                                        }}
                                        disabled={isFormatDisabled("jpeg")}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                            isFormatDisabled("jpeg")
                                                ? "opacity-40 cursor-not-allowed bg-surface/30 border-border/30 text-foreground/40"
                                                : targetFormat === "jpeg"
                                                ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20 cursor-pointer"
                                                : "bg-surface/60 border-border/60 hover:bg-surface text-foreground cursor-pointer"
                                        }`}
                                        title={isFormatDisabled("jpeg") ? "Semua berkas sudah berformat JPG" : "Ubah ke format JPG"}
                                    >
                                        JPG (JPEG) {isFormatDisabled("jpeg") && <span className="block text-[9px] font-normal opacity-80">(Sudah JPG)</span>}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!isFormatDisabled("png")) {
                                                setTargetFormat("png");
                                                setActivePreset("");
                                            }
                                        }}
                                        disabled={isFormatDisabled("png")}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                            isFormatDisabled("png")
                                                ? "opacity-40 cursor-not-allowed bg-surface/30 border-border/30 text-foreground/40"
                                                : targetFormat === "png"
                                                ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20 cursor-pointer"
                                                : "bg-surface/60 border-border/60 hover:bg-surface text-foreground cursor-pointer"
                                        }`}
                                        title={isFormatDisabled("png") ? "Semua berkas sudah berformat PNG" : "Ubah ke format PNG"}
                                    >
                                        PNG (Lossless) {isFormatDisabled("png") && <span className="block text-[9px] font-normal opacity-80">(Sudah PNG)</span>}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!isFormatDisabled("webp")) {
                                                setTargetFormat("webp");
                                                setActivePreset("");
                                            }
                                        }}
                                        disabled={isFormatDisabled("webp")}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                            isFormatDisabled("webp")
                                                ? "opacity-40 cursor-not-allowed bg-surface/30 border-border/30 text-foreground/40"
                                                : targetFormat === "webp"
                                                ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20 cursor-pointer"
                                                : "bg-surface/60 border-border/60 hover:bg-surface text-foreground cursor-pointer"
                                        }`}
                                        title={isFormatDisabled("webp") ? "Semua berkas sudah berformat WebP" : "Ubah ke format WebP"}
                                    >
                                        WEBP (Modern) {isFormatDisabled("webp") && <span className="block text-[9px] font-normal opacity-80">(Sudah WebP)</span>}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (avifSupported && !isFormatDisabled("avif")) {
                                                setTargetFormat("avif");
                                                setActivePreset("");
                                            }
                                        }}
                                        disabled={!avifSupported || isFormatDisabled("avif")}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                            !avifSupported || isFormatDisabled("avif")
                                                ? "opacity-40 cursor-not-allowed bg-surface/30 border-border/30 text-foreground/40"
                                                : targetFormat === "avif"
                                                ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20 cursor-pointer"
                                                : "bg-surface/60 border-border/60 hover:bg-surface text-foreground cursor-pointer"
                                        }`}
                                        title={
                                            !avifSupported
                                                ? "Browser Anda belum mendukung ekspor AVIF"
                                                : isFormatDisabled("avif")
                                                ? "Semua berkas sudah berformat AVIF"
                                                : "Ubah ke format AVIF"
                                        }
                                    >
                                        AVIF {!avifSupported ? "(!)" : isFormatDisabled("avif") ? <span className="block text-[9px] font-normal opacity-80">(Sudah AVIF)</span> : ""}
                                    </button>
                                </div>
                            </div>

                            {/* 2. Kualitas Kompresi */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <label className="font-bold uppercase tracking-wider text-foreground/50">
                                        Kualitas Kompresi
                                    </label>
                                    <span className="font-mono font-bold text-amber-400">
                                        {targetFormat === "png" ? "100% (Lossless)" : `${quality}%`}
                                    </span>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-surface/40 border border-border/60 space-y-2">
                                    <input
                                        type="range"
                                        min="10"
                                        max="100"
                                        step="1"
                                        value={quality}
                                        disabled={targetFormat === "png"}
                                        onChange={(e) => {
                                            setQuality(Number(e.target.value));
                                            setActivePreset("");
                                        }}
                                        className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
                                    />
                                    <div className="flex justify-between text-[10px] text-foreground/50 font-medium">
                                        <span>Kecil (10%)</span>
                                        <span>Optimal (85-92%)</span>
                                        <span>Maksimal (100%)</span>
                                    </div>
                                </div>
                                {targetFormat === "png" && (
                                    <p className="text-[11px] text-foreground/50 italic">
                                        *PNG tidak memakai lossy quality untuk menjaga ketajaman piksel asli.
                                    </p>
                                )}
                            </div>

                            {/* 3. Latar Belakang Transparansi & Skala */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-foreground/50 flex items-center justify-between">
                                    <span>Latar Transparansi & Skala</span>
                                </label>
                                <div className="p-3.5 rounded-2xl bg-surface/40 border border-border/60 space-y-3">
                                    {/* Latar Belakang */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-xs text-foreground/80">
                                            <Palette className="w-3.5 h-3.5 text-amber-500" />
                                            <span>Warna Latar</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {/* Warna Putih */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setBgColor("#ffffff");
                                                    setFillBg(true);
                                                }}
                                                className={`w-6 h-6 rounded-full border cursor-pointer ${
                                                    bgColor === "#ffffff" ? "ring-2 ring-amber-500 scale-110" : "border-border"
                                                }`}
                                                style={{ backgroundColor: "#ffffff" }}
                                                title="Latar Putih Bersih"
                                            />
                                            {/* Warna Hitam */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setBgColor("#000000");
                                                    setFillBg(true);
                                                }}
                                                className={`w-6 h-6 rounded-full border cursor-pointer ${
                                                    bgColor === "#000000" ? "ring-2 ring-amber-500 scale-110" : "border-border"
                                                }`}
                                                style={{ backgroundColor: "#000000" }}
                                                title="Latar Hitam"
                                            />
                                            {/* Custom Color Input */}
                                            <input
                                                type="color"
                                                value={bgColor}
                                                onChange={(e) => {
                                                    setBgColor(e.target.value);
                                                    setFillBg(true);
                                                }}
                                                className="w-6 h-6 rounded-full border border-border cursor-pointer p-0 bg-transparent"
                                                title="Pilih Warna Kustom"
                                            />
                                        </div>
                                    </div>

                                    {/* Pilihan Skala */}
                                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                                        <span className="text-foreground/70">Ukuran Dimensi:</span>
                                        <div className="flex items-center gap-1">
                                            {([100, 75, 50] as ScaleOption[]).map((opt) => (
                                                <button
                                                    key={opt}
                                                    onClick={() => setScale(opt)}
                                                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                                        scale === opt
                                                            ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                                                            : "bg-surface/50 border-border/60 text-foreground/60 hover:text-foreground"
                                                    }`}
                                                >
                                                    {opt}%
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Converter Big Buttons & Progress */}
                        <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-xs text-foreground/60">
                                {convertibleCount === 0 ? (
                                    <span className="text-amber-400 font-medium">
                                        ✨ Seluruh gambar pada antrean sudah berformat .{targetFormat === "jpeg" ? "jpg" : targetFormat}. Pilih format target lain untuk mengubahnya.
                                    </span>
                                ) : (
                                    <span>
                                        💡 Klik &quot;Konversi {convertibleCount === images.length ? "Semua" : "Gambar"}&quot; untuk memproses berkas yang belum berformat .{targetFormat === "jpeg" ? "jpg" : targetFormat}.
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                    onClick={handleConvertAll}
                                    disabled={isProcessingBatch || convertibleCount === 0}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-98"
                                >
                                    {isProcessingBatch ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Memproses ({batchProgress}%)...</span>
                                        </>
                                    ) : convertibleCount === 0 ? (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>Sudah Format .{targetFormat === "jpeg" ? "jpg" : targetFormat}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            <span>
                                                Konversi {convertibleCount === images.length ? `Semua (${images.length})` : `${convertibleCount} Gambar`}
                                            </span>
                                        </>
                                    )}
                                </button>

                                {stats.convertedCount > 0 && (
                                    <button
                                        onClick={handleDownloadAllZip}
                                        disabled={isZipping}
                                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-surface border border-border/80 hover:border-amber-500/40 hover:bg-surface/80 text-foreground font-bold text-sm transition-all cursor-pointer active:scale-98"
                                    >
                                        {isZipping ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                                        ) : (
                                            <FolderArchive className="w-4 h-4 text-amber-500" />
                                        )}
                                        <span>Unduh Semua ({stats.convertedCount} ZIP)</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Monotonic Progress Bar */}
                        {isProcessingBatch && (
                            <div className="space-y-1.5 pt-1">
                                <div className="w-full h-2 rounded-full bg-surface overflow-hidden border border-border/50">
                                    <div
                                        className="h-full bg-linear-to-r from-amber-500 to-amber-300 transition-all duration-300"
                                        style={{ width: `${batchProgress}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-right text-foreground/50 font-mono">
                                    Progres: {batchProgress}%
                                </p>
                            </div>
                        )}
                    </div>

                    {/* HUD Statistics */}
                    {stats.convertedCount > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="glass-panel p-4 rounded-2xl border border-border/60">
                                <p className="text-xs text-foreground/50">Gambar Selesai</p>
                                <p className="text-xl font-black text-foreground mt-0.5">
                                    {stats.convertedCount} <span className="text-xs font-normal text-foreground/50">/ {stats.totalCount}</span>
                                </p>
                            </div>
                            <div className="glass-panel p-4 rounded-2xl border border-border/60">
                                <p className="text-xs text-foreground/50">Total Ukuran Asli</p>
                                <p className="text-xl font-black text-foreground mt-0.5">
                                    {formatBytes(stats.totalOrigSize)}
                                </p>
                            </div>
                            <div className="glass-panel p-4 rounded-2xl border border-border/60">
                                <p className="text-xs text-foreground/50">Total Ukuran Hasil</p>
                                <p className="text-xl font-black text-amber-400 mt-0.5">
                                    {formatBytes(stats.totalOutputSize)}
                                </p>
                            </div>
                            <div className="glass-panel p-4 rounded-2xl border border-border/60">
                                <p className="text-xs text-foreground/50">Efisiensi Rata-rata</p>
                                <p className={`text-xl font-black mt-0.5 ${stats.savingsPercent >= 0 ? "text-emerald-400" : "text-blue-400"}`}>
                                    {stats.savingsPercent >= 0 ? `Hemat ${stats.savingsPercent}%` : `+${Math.abs(stats.savingsPercent)}% (Lossless)`}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Visual Image Grid List */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-foreground/60 px-1">
                            <span>Daftar Gambar ({images.length})</span>
                            <span>Target: .{targetFormat === "jpeg" ? "jpg" : targetFormat}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {images.map((item) => {
                                const isSuccess = item.status === "success";
                                const isError = item.status === "error";
                                const isConverting = item.status === "processing";
                                const isSame = isSameFormat(item.originalFormat, targetFormat);

                                return (
                                    <div
                                        key={item.id}
                                        className={`glass-panel p-4 rounded-2xl border transition-all duration-200 flex gap-4 items-center ${
                                            isSuccess
                                                ? "border-emerald-500/30 bg-surface/70"
                                                : isError
                                                ? "border-rose-500/30 bg-rose-500/5"
                                                : isConverting
                                                ? "border-amber-500/40 bg-amber-500/5"
                                                : isSame
                                                ? "border-amber-500/20 bg-amber-500/2"
                                                : "border-border/70 hover:border-border"
                                        }`}
                                    >
                                        {/* Thumbnail with Lightbox Button */}
                                        <div
                                            className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-border/60 bg-black/20 group cursor-pointer"
                                            onClick={() => handleOpenLightbox(item)}
                                            title="Klik untuk pratinjau besar HD"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={isSuccess && item.outputUrl ? item.outputUrl : item.previewUrl}
                                                alt={item.file.name}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Eye className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded-md bg-black/70 text-[9px] font-mono text-white/90">
                                                {isSuccess ? `.${targetFormat === "jpeg" ? "jpg" : targetFormat}` : item.originalFormat}
                                            </span>
                                        </div>

                                        {/* Info Details */}
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <p className="text-xs sm:text-sm font-bold text-foreground truncate" title={item.file.name}>
                                                {item.file.name}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-foreground/60">
                                                <span>Asli: {formatBytes(item.originalSize)}</span>
                                                {item.originalWidth > 0 && (
                                                    <span>• {item.originalWidth}×{item.originalHeight}</span>
                                                )}
                                            </div>

                                            {/* Penanda bahwa format asal sudah sama persis dengan target */}
                                            {isSame && !isSuccess && (
                                                <div className="pt-0.5">
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                                        <CheckCircle2 className="w-3 h-3 text-amber-400" />
                                                        Sudah berformat .{item.originalFormat.toLowerCase()} (Tidak perlu dikonversi)
                                                    </span>
                                                </div>
                                            )}

                                            {/* Result details */}
                                            {isSuccess && item.outputSize && (
                                                <div className="flex items-center gap-2 pt-0.5 text-xs font-semibold">
                                                    <span className="text-emerald-400 font-mono">
                                                        ➔ {formatBytes(item.outputSize)}
                                                    </span>
                                                    {item.originalSize > item.outputSize && (
                                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                            Hemat {Math.round(((item.originalSize - item.outputSize) / item.originalSize) * 100)}%
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {isError && (
                                                <p className="text-[11px] text-rose-400 font-medium truncate">
                                                    {item.errorMsg || "Gagal konversi"}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions per item */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {isConverting ? (
                                                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                </div>
                                            ) : isSuccess ? (
                                                <button
                                                    onClick={() => handleDownloadSingle(item)}
                                                    className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors cursor-pointer"
                                                    title="Unduh berkas hasil konversi"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            ) : isSame ? (
                                                <button
                                                    disabled
                                                    className="p-2 rounded-xl bg-surface/40 border border-border/40 text-foreground/30 cursor-not-allowed text-xs font-semibold"
                                                    title={`Berkas ini sudah berformat .${item.originalFormat.toLowerCase()}, tidak dapat dikonversi ke format yang sama`}
                                                >
                                                    <ArrowLeftRight className="w-4 h-4 text-foreground/30" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleConvertSingle(item.id)}
                                                    className="p-2 rounded-xl bg-surface hover:bg-surface/80 border border-border/70 text-foreground/70 hover:text-foreground transition-colors cursor-pointer text-xs font-semibold"
                                                    title="Konversi gambar ini saja"
                                                >
                                                    <ArrowLeftRight className="w-4 h-4 text-amber-500" />
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="p-2 rounded-xl hover:bg-rose-500/10 text-foreground/40 hover:text-rose-400 transition-colors cursor-pointer"
                                                title="Hapus gambar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Interactive Lightbox HD Modal */}
            <MediaLightboxModal
                isOpen={!!lightboxItem}
                onClose={() => setLightboxItem(null)}
                item={lightboxItem}
                accentColor="amber"
            />
        </div>
    );
}
