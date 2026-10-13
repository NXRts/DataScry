"use client";

import { useState, useRef } from "react";
import Dropzone from "@/components/ui/Dropzone";
import imageCompression from "browser-image-compression";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import {
    Minimize2,
    Sparkles,
    Sliders,
    HardDrive,
    Download,
    RotateCcw,
    CheckCircle2,
    AlertCircle,
    Loader2,
    FileText,
    Image as ImageIcon,
    FileArchive,
    Check,
    FolderOpen,
    Info,
    Eye,
    PenLine
} from "lucide-react";
import MediaLightboxModal, { LightboxItem } from "@/components/shared/MediaLightboxModal";
import PdfEmbeddedViewer from "@/components/shared/PdfEmbeddedViewer";

type CompressionMode = "recommended" | "extreme" | "light" | "custom";

interface CompressFileItem {
    id: string;
    file: File;
    status: "idle" | "processing" | "success" | "error";
    progress: number;
    originalSize: number;
    compressedSize?: number;
    compressedBlob?: Blob;
    errorMsg?: string;
    customFileName?: string;
}

export default function ClientCompress() {
    const [files, setFiles] = useState<CompressFileItem[]>([]);
    const [mode, setMode] = useState<CompressionMode>("recommended");
    const [customTargetKB, setCustomTargetKB] = useState<number>(300);
    const [isProcessingAll, setIsProcessingAll] = useState(false);
    const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null);
    const [activePdfPreview, setActivePdfPreview] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [singleCustomName, setSingleCustomName] = useState<string>("");
    const [customZipName, setCustomZipName] = useState<string>("DataScry-Kompresi");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getFinalSingleFileName = (item: CompressFileItem) => {
        const nameParts = item.file.name.split('.');
        const ext = nameParts.length > 1 ? nameParts.pop() : "";
        const defaultBase = `${nameParts.join('.')}-terkompres`;

        let chosen = "";
        if (files.length === 1 && singleCustomName) {
            chosen = singleCustomName;
        } else if (item.customFileName) {
            chosen = item.customFileName;
        } else {
            chosen = defaultBase;
        }

        const clean = chosen.trim().replace(/[/\\?%*:|"<>]/g, "");
        const baseName = clean || defaultBase;
        return ext ? (baseName.endsWith(`.${ext}`) ? baseName : `${baseName}.${ext}`) : baseName;
    };

    const getFinalZipName = () => {
        const clean = customZipName.trim().replace(/[/\\?%*:|"<>]/g, "");
        const baseName = clean || "DataScry-Kompresi";
        return baseName.endsWith(".zip") ? baseName : `${baseName}.zip`;
    };

    const handlePreview = (item: CompressFileItem) => {
        const isPdf = item.file.type === "application/pdf";
        const targetBlob = item.compressedBlob || item.file;
        const finalName = getFinalSingleFileName(item);

        if (isPdf) {
            setActivePdfPreview({
                blob: targetBlob,
                fileName: finalName
            });
        } else {
            const previewUrl = URL.createObjectURL(targetBlob);
            setLightboxItem({
                url: previewUrl,
                title: `${finalName} ${item.compressedSize ? "(Hasil Kompresi)" : "(Asli)"}`,
                size: item.compressedSize || item.originalSize,
                aspectRatio: item.file.type.replace("image/", "").toUpperCase()
            });
        }
    };

    const handleFilesAccepted = (acceptedFiles: File[]) => {
        const newItems: CompressFileItem[] = acceptedFiles.map(file => {
            const rawBase = file.name.replace(/\.[^/.]+$/, "");
            const clean = rawBase.replace(/[/\\?%*:|"<>]/g, "").trim();
            return {
                id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                file,
                status: "idle",
                progress: 0,
                originalSize: file.size,
                customFileName: clean ? `${clean}-terkompres` : "file-terkompres",
            };
        });

        if (files.length === 0 && acceptedFiles.length === 1) {
            const rawBase = acceptedFiles[0].name.replace(/\.[^/.]+$/, "");
            const clean = rawBase.replace(/[/\\?%*:|"<>]/g, "").trim();
            setSingleCustomName(clean ? `${clean}-terkompres` : "file-terkompres");
            setCustomZipName(clean ? `${clean}-kompresi` : "DataScry-Kompresi");
        } else if (files.length === 0 && acceptedFiles.length > 1) {
            setCustomZipName("DataScry-Kompresi");
        }

        setFiles(prev => [...prev, ...newItems]);
    };

    const handleClearAll = () => {
        setFiles([]);
        setSingleCustomName("");
        setCustomZipName("DataScry-Kompresi");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleRemoveFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const updateItem = (id: string, updates: Partial<CompressFileItem>) => {
        setFiles(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const compressSingleFile = async (item: CompressFileItem): Promise<void> => {
        const { id, file } = item;
        updateItem(id, { status: "processing", progress: 15, errorMsg: undefined });

        try {
            if (file.type.startsWith("image/")) {
                let maxSizeMB = 1;
                let maxWidthOrHeight = 1920;
                let initialQuality = 0.75;

                if (mode === "extreme") {
                    maxSizeMB = 0.25;
                    maxWidthOrHeight = 1280;
                    initialQuality = 0.55;
                } else if (mode === "light") {
                    maxSizeMB = 3;
                    maxWidthOrHeight = 2560;
                    initialQuality = 0.88;
                } else if (mode === "custom") {
                    maxSizeMB = Math.max(0.05, customTargetKB / 1024);
                    maxWidthOrHeight = customTargetKB <= 200 ? 1280 : 1920;
                    initialQuality = customTargetKB <= 200 ? 0.6 : 0.75;
                }

                const options = {
                    maxSizeMB,
                    maxWidthOrHeight,
                    initialQuality,
                    useWebWorker: true,
                    onProgress: (p: number) => {
                        updateItem(id, { progress: Math.min(95, Math.max(20, Math.round(p))) });
                    }
                };

                const compressed = await imageCompression(file, options);
                updateItem(id, {
                    status: "success",
                    progress: 100,
                    compressedBlob: compressed,
                    compressedSize: compressed.size
                });
            } else if (file.type === "application/pdf") {
                updateItem(id, { progress: 30 });
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

                updateItem(id, { progress: 60 });
                // Strip unnecessary metadata
                pdfDoc.setTitle('');
                pdfDoc.setAuthor('');
                pdfDoc.setSubject('');
                pdfDoc.setKeywords([]);
                pdfDoc.setProducer('');
                pdfDoc.setCreator('');

                updateItem(id, { progress: 85 });
                const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
                const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });

                updateItem(id, {
                    status: "success",
                    progress: 100,
                    compressedBlob: blob,
                    compressedSize: blob.size
                });
            } else {
                throw new Error("Format file tidak didukung untuk kompresi.");
            }
        } catch (err: unknown) {
            console.error("Compression error:", err);
            const errorMessage = err instanceof Error ? err.message : "Gagal mengkompres file ini.";
            updateItem(id, {
                status: "error",
                progress: 0,
                errorMsg: errorMessage
            });
        }
    };

    const processAllFiles = async () => {
        setIsProcessingAll(true);
        const pending = files.filter(f => f.status === "idle" || f.status === "error");
        for (const item of pending) {
            await compressSingleFile(item);
        }
        setIsProcessingAll(false);
    };

    const downloadFile = (item: CompressFileItem) => {
        if (!item.compressedBlob) return;
        const url = URL.createObjectURL(item.compressedBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = getFinalSingleFileName(item);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const downloadAllAsZip = async () => {
        const successFiles = files.filter(f => f.status === "success" && f.compressedBlob);
        if (successFiles.length === 0) return;

        if (successFiles.length === 1) {
            downloadFile(successFiles[0]);
            return;
        }

        const zip = new JSZip();
        successFiles.forEach(item => {
            if (item.compressedBlob) {
                zip.file(getFinalSingleFileName(item), item.compressedBlob);
            }
        });

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = getFinalZipName();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const calculateSavings = (original: number, compressed?: number) => {
        if (!compressed || original <= 0) return 0;
        const diff = original - compressed;
        if (diff <= 0) return 0;
        return Math.round((diff / original) * 100);
    };

    const successCount = files.filter(f => f.status === "success").length;
    const totalOriginalSize = files.reduce((acc, f) => acc + f.originalSize, 0);
    const totalCompressedSize = files.reduce((acc, f) => acc + (f.compressedSize || f.originalSize), 0);
    const totalSavings = calculateSavings(totalOriginalSize, totalCompressedSize);

    return (
        <div className="space-y-8 w-full">
            {/* Hidden Input for direct picking */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        handleFilesAccepted(Array.from(e.target.files));
                    }
                }}
            />

            {/* Compression Settings Panel */}
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-border/80 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                            <Sliders className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base sm:text-lg text-foreground">Pengaturan Level Kompresi</h3>
                            <p className="text-xs text-foreground/60">Tentukan seberapa agresif pemangkasan ukuran berkas</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border/70 text-xs font-semibold text-foreground/70">
                        <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                        <span>100% Pemrosesan di Memori Browser</span>
                    </div>
                </div>

                {/* Mode Selector Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                    <button
                        type="button"
                        onClick={() => setMode("recommended")}
                        className={`p-3 sm:p-4 rounded-2xl border text-left transition-all relative ${mode === "recommended"
                            ? "bg-blue-500/10 border-blue-500 text-foreground ring-2 ring-blue-500/20"
                            : "bg-surface/50 border-border/60 hover:bg-surface hover:border-border text-foreground/80"
                            }`}
                    >
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                            <span className="font-bold text-xs sm:text-sm text-blue-400">Rekomendasi</span>
                            {mode === "recommended" && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />}
                        </div>
                        <p className="text-[11px] sm:text-xs text-foreground/60 leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none">
                            Keseimbangan ideal antara kualitas visual prima dan ukuran hemat (~60-75% reduksi).
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setMode("extreme")}
                        className={`p-3 sm:p-4 rounded-2xl border text-left transition-all relative ${mode === "extreme"
                            ? "bg-purple-500/10 border-purple-500 text-foreground ring-2 ring-purple-500/20"
                            : "bg-surface/50 border-border/60 hover:bg-surface hover:border-border text-foreground/80"
                            }`}
                    >
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                            <span className="font-bold text-xs sm:text-sm text-purple-400">Ekstrem</span>
                            {mode === "extreme" && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0" />}
                        </div>
                        <p className="text-[11px] sm:text-xs text-foreground/60 leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none">
                            Pemangkasan agresif hingga 80-90% untuk ukuran sekecil mungkin.
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setMode("light")}
                        className={`p-3 sm:p-4 rounded-2xl border text-left transition-all relative ${mode === "light"
                            ? "bg-emerald-500/10 border-emerald-500 text-foreground ring-2 ring-emerald-500/20"
                            : "bg-surface/50 border-border/60 hover:bg-surface hover:border-border text-foreground/80"
                            }`}
                    >
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                            <span className="font-bold text-xs sm:text-sm text-emerald-400">Kualitas Prima</span>
                            {mode === "light" && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />}
                        </div>
                        <p className="text-[11px] sm:text-xs text-foreground/60 leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none">
                            Kompresi halus (~20-40%) mempertahankan ketajaman mendekati aslinya.
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setMode("custom")}
                        className={`p-3 sm:p-4 rounded-2xl border text-left transition-all relative ${mode === "custom"
                            ? "bg-amber-500/10 border-amber-500 text-foreground ring-2 ring-amber-500/20"
                            : "bg-surface/50 border-border/60 hover:bg-surface hover:border-border text-foreground/80"
                            }`}
                    >
                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                            <span className="font-bold text-xs sm:text-sm text-amber-400">Target Khusus</span>
                            {mode === "custom" && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />}
                        </div>
                        <p className="text-[11px] sm:text-xs text-foreground/60 leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none">
                            Tentukan batas ukuran presisi (cocok untuk syarat upload CPNS / CASN).
                        </p>
                    </button>
                </div>

                {/* Custom Target Size Controls */}
                {mode === "custom" && (
                    <div className="p-3.5 sm:p-5 rounded-2xl bg-surface/70 border border-amber-500/30 space-y-3 sm:space-y-4 animate-fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                            <label className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5 sm:gap-2">
                                <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                                <span>Target Ukuran Maksimal Berkas:</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="50"
                                    max="5000"
                                    step="50"
                                    value={customTargetKB}
                                    onChange={(e) => setCustomTargetKB(Math.max(30, Number(e.target.value)))}
                                    className="w-24 sm:w-28 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-surface border border-border/80 text-foreground font-bold text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                />
                                <span className="text-xs sm:text-sm font-bold text-foreground/70">KB</span>
                            </div>
                        </div>

                        {/* Quick Presets for Portals */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 border-t border-border/40">
                            <span className="text-[11px] sm:text-xs font-medium text-foreground/50">Pilihan Cepat Portal:</span>
                            {[
                                { label: "100 KB (Pasfoto)", val: 100 },
                                { label: "200 KB (KTP/Kartu)", val: 200 },
                                { label: "300 KB (Ijazah/BKN)", val: 300 },
                                { label: "500 KB (Dokumen)", val: 500 },
                                { label: "1 MB (Standar)", val: 1000 },
                            ].map((preset) => (
                                <button
                                    key={preset.val}
                                    type="button"
                                    onClick={() => setCustomTargetKB(preset.val)}
                                    className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold rounded-lg border transition-colors ${customTargetKB === preset.val
                                        ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                                        : "bg-surface hover:bg-surface/80 text-foreground/70 border-border/60"
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Dropzone & File Management */}
            {files.length === 0 ? (
                <div className="animate-fade-in">
                    <Dropzone
                        onFilesAccepted={handleFilesAccepted}
                        accept="image/*,application/pdf"
                        title="Tarik & Letakkan File untuk Dikompres"
                        description="Mendukung dokumen PDF serta gambar JPG, PNG, dan WebP. Pemrosesan 100% lokal di komputer Anda."
                        icons={
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 text-blue-400 font-semibold">
                                    <FileText className="w-4 h-4" /> PDF
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-purple-400 font-semibold">
                                    <ImageIcon className="w-4 h-4" /> JPG / PNG / WebP
                                </span>
                            </div>
                        }
                    />
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    {/* Top Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 p-3.5 sm:p-5 rounded-2xl bg-surface/60 border border-border/60 backdrop-blur-md shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                                <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-sm sm:text-base text-foreground truncate">
                                    {files.length} Berkas Dipilih
                                </h4>
                                <p className="text-[11px] sm:text-xs text-foreground/60">
                                    Total: {formatBytes(totalOriginalSize)}
                                    {successCount > 0 && totalSavings > 0 && (
                                        <span className="text-emerald-400 font-bold ml-1.5 sm:ml-2">
                                            • Hemat {totalSavings}% ({formatBytes(totalOriginalSize - totalCompressedSize)})
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-foreground/80 hover:text-foreground bg-surface hover:bg-surface/80 border border-border/70 rounded-xl transition-all active:scale-95"
                            >
                                <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                                <span>Tambah File</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-foreground/70 hover:text-rose-400 bg-surface hover:bg-rose-500/10 border border-border/70 hover:border-rose-500/30 rounded-xl transition-all active:scale-95"
                            >
                                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span>Bersihkan</span>
                            </button>

                            {successCount < files.length && (
                                <button
                                    type="button"
                                    onClick={processAllFiles}
                                    disabled={isProcessingAll}
                                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2 text-xs sm:text-sm font-bold text-white rounded-xl shadow-lg transition-all ${isProcessingAll
                                        ? "bg-blue-500/50 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-500 shadow-blue-500/25 hover:scale-[1.02] active:scale-95"
                                        }`}
                                >
                                    {isProcessingAll ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Mengompres...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            <span>Mulai Kompres Semua</span>
                                        </>
                                    )}
                                </button>
                            )}

                            {successCount > 0 && (
                                <button
                                    type="button"
                                    onClick={downloadAllAsZip}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/25 rounded-xl transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Unduh Semua ({successCount})</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Panel Kustomisasi Nama File / ZIP */}
                    <div className="p-3.5 sm:p-5 rounded-2xl bg-surface/70 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-sm">
                        <div className="space-y-0.5 sm:space-y-1">
                            <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5 uppercase tracking-wide">
                                <PenLine className="w-3.5 h-3.5 text-blue-500" />
                                <span>{files.length === 1 ? "Nama Berkas Hasil Kompresi" : "Nama Paket Arsip Unduhan (ZIP)"}</span>
                            </label>
                            <p className="text-[10px] sm:text-[11px] text-foreground/50">
                                {files.length === 1
                                    ? "Sesuaikan nama berkas hasil kompresi sebelum atau sesudah diunduh."
                                    : "Nama berkas .zip jika Anda mengunduh seluruh berkas sekaligus."}
                            </p>
                        </div>
                        <div className="relative flex items-center w-full sm:max-w-xs">
                            <input
                                type="text"
                                value={files.length === 1 ? singleCustomName : customZipName}
                                onChange={(e) => {
                                    if (files.length === 1) {
                                        setSingleCustomName(e.target.value);
                                    } else {
                                        setCustomZipName(e.target.value);
                                    }
                                }}
                                placeholder={files.length === 1 ? "nama-terkompres" : "DataScry-Kompresi"}
                                className="w-full px-3 py-1.5 sm:px-3.5 sm:py-2 pr-14 text-xs sm:text-sm rounded-xl bg-surface border border-border/80 focus:border-blue-500/80 focus:outline-hidden text-foreground font-semibold shadow-inner"
                            />
                            <span className="absolute right-3.5 text-xs font-bold text-blue-400 pointer-events-none select-none">
                                .{files.length === 1 ? (files[0].file.name.split('.').pop() || "pdf") : "zip"}
                            </span>
                        </div>
                    </div>

                    {/* Files List Table / Cards */}
                    <div className="glass-panel overflow-hidden rounded-2xl border border-border/60 shadow-xl">
                        <div className="divide-y divide-border/40">
                            {files.map((item) => {
                                const savings = calculateSavings(item.originalSize, item.compressedSize);
                                const isPdf = item.file.type === "application/pdf";

                                return (
                                    <div
                                        key={item.id}
                                        className="p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-surface/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                                            <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${isPdf ? "bg-rose-500/10 text-rose-400" : "bg-blue-500/10 text-blue-400"
                                                }`}>
                                                {isPdf ? <FileText className="w-4 h-4 sm:w-5 sm:h-5" /> : <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-xs sm:text-sm md:text-base text-foreground truncate max-w-44 sm:max-w-xs md:max-w-md">
                                                    {item.file.name}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-foreground/60 mt-0.5">
                                                    <span>Asli: {formatBytes(item.originalSize)}</span>
                                                    {item.status === "success" && item.compressedSize !== undefined && (
                                                        <>
                                                            <span>➔</span>
                                                            <span className="text-emerald-400 font-bold">
                                                                {formatBytes(item.compressedSize)}
                                                            </span>
                                                            {savings > 0 && (
                                                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                                                                    Hemat {savings}%
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                {files.length > 1 && (
                                                    <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5">
                                                        <PenLine className="w-3 h-3 text-foreground/40 shrink-0" />
                                                        <span className="text-[10px] text-foreground/50">Nama:</span>
                                                        <input
                                                            type="text"
                                                            value={item.customFileName ?? ""}
                                                            onChange={(e) => updateItem(item.id, { customFileName: e.target.value })}
                                                            placeholder={`${item.file.name.replace(/\.[^/.]+$/, "")}-terkompres`}
                                                            className="text-xs px-2 py-0.5 rounded-md bg-surface border border-border/60 text-foreground placeholder:text-foreground/30 focus:border-blue-500/70 focus:outline-hidden max-w-36 sm:max-w-60"
                                                        />
                                                        <span className="text-[10px] font-semibold text-foreground/40">
                                                            .{item.file.name.split('.').pop()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/30">
                                            {/* Progress bar if processing */}
                                            {item.status === "processing" && (
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-24 bg-surface rounded-full h-2 overflow-hidden border border-border/50">
                                                        <div
                                                            className="bg-blue-500 h-full transition-all duration-200"
                                                            style={{ width: `${item.progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-mono text-blue-400 font-bold">{item.progress}%</span>
                                                </div>
                                            )}

                                            {/* Success state */}
                                            {item.status === "success" && (
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span className="hidden sm:inline">Siap</span>
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => downloadFile(item)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-all"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                        <span>Unduh</span>
                                                    </button>
                                                </div>
                                            )}

                                            {/* Error state */}
                                            {item.status === "error" && (
                                                <div className="flex items-center gap-2 text-rose-400 text-xs">
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span className="truncate max-w-35">{item.errorMsg || "Gagal"}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => compressSingleFile(item)}
                                                        className="underline text-xs hover:text-rose-300"
                                                    >
                                                        Ulangi
                                                    </button>
                                                </div>
                                            )}

                                            {/* Idle state single action */}
                                            {item.status === "idle" && (
                                                <button
                                                    type="button"
                                                    onClick={() => compressSingleFile(item)}
                                                    className="px-3 py-1.5 text-xs font-semibold text-foreground/80 hover:text-foreground bg-surface hover:bg-surface/80 border border-border/70 rounded-lg transition-colors"
                                                >
                                                    Kompres
                                                </button>
                                            )}

                                            {/* Preview Button (Eye) for checking image/pdf quality */}
                                            <button
                                                type="button"
                                                onClick={() => handlePreview(item)}
                                                className="p-1.5 rounded-lg bg-surface border border-border/70 hover:bg-surface/80 text-foreground/70 hover:text-blue-400 transition-colors cursor-pointer"
                                                title={item.file.type === "application/pdf" ? "Buka Pratinjau PDF" : "Pratinjau Kualitas Gambar (Zoom & Pan)"}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>

                                            {/* Remove button */}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFile(item.id)}
                                                className="p-1.5 text-foreground/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                                title="Hapus file ini dari daftar"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Active PDF Embedded Preview */}
                    {activePdfPreview && (
                        <div className="pt-2 animate-fade-in">
                            <PdfEmbeddedViewer
                                blob={activePdfPreview.blob}
                                fileName={activePdfPreview.fileName}
                                title={`Pratinjau Dokumen: ${activePdfPreview.fileName}`}
                                onClose={() => setActivePdfPreview(null)}
                                accentColor="blue"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Reusable Image Lightbox Modal with Zoom & Pan */}
            <MediaLightboxModal
                isOpen={lightboxItem !== null}
                onClose={() => setLightboxItem(null)}
                item={lightboxItem}
                accentColor="blue"
            />
        </div>
    );
}
