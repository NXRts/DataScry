"use client";

import { useState, useRef } from "react";
import Dropzone from "@/components/ui/Dropzone";
import JSZip from "jszip";
import {
    FileArchive,
    FolderArchive,
    Sliders,
    Download,
    RotateCcw,
    Sparkles,
    CheckCircle2,
    FileText,
    FolderOpen,
    Loader2,
    HardDrive,
    Trash2,
    Check,
    AlertCircle,
    X,
    Eye,
    Image as ImageIcon
} from "lucide-react";
import MediaLightboxModal, { LightboxItem } from "@/components/shared/MediaLightboxModal";

type CompressionLevel = 9 | 6 | 1 | 0;

interface ArchiveItem {
    id: string;
    file: File;
    name: string;
    size: number;
    previewUrl?: string;
    isImage: boolean;
}

export default function ClientArchiveZip() {
    const [files, setFiles] = useState<ArchiveItem[]>([]);
    const [archiveName, setArchiveName] = useState<string>("Arsip-DataScry");
    const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>(9);
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [currentFileTask, setCurrentFileTask] = useState<string>("");
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [resultSize, setResultSize] = useState<number>(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFilesAccepted = (acceptedFiles: File[]) => {
        const newItems: ArchiveItem[] = acceptedFiles.map(file => {
            const isImage = file.type.startsWith("image/");
            return {
                id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                file,
                name: file.name,
                size: file.size,
                isImage,
                previewUrl: isImage ? URL.createObjectURL(file) : undefined
            };
        });
        setFiles(prev => [...prev, ...newItems]);
        setResultBlob(null);
        setErrorMessage(null);
    };

    const handleClearAll = () => {
        files.forEach(f => {
            if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        });
        setFiles([]);
        setResultBlob(null);
        setProgress(0);
        setCurrentFileTask("");
        setErrorMessage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleRemoveFile = (id: string) => {
        setFiles(prev => {
            const target = prev.find(f => f.id === id);
            if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
            return prev.filter(f => f.id !== id);
        });
        setResultBlob(null);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const totalOriginalSize = files.reduce((acc, f) => acc + f.size, 0);

    const createZipArchive = async () => {
        if (files.length === 0) return;
        setIsCreating(true);
        setProgress(0);
        setResultBlob(null);

        try {
            const zip = new JSZip();

            files.forEach((item) => {
                zip.file(item.name, item.file);
            });

            const isStore = compressionLevel === 0;

            const content = await zip.generateAsync(
                {
                    type: "blob",
                    compression: isStore ? "STORE" : "DEFLATE",
                    compressionOptions: isStore ? undefined : { level: compressionLevel },
                },
                (metadata) => {
                    setProgress(Math.round(metadata.percent));
                    if (metadata.currentFile) {
                        setCurrentFileTask(metadata.currentFile);
                    }
                }
            );

            setResultBlob(content);
            setResultSize(content.size);
            setProgress(100);
        } catch (error) {
            console.error("Failed to create ZIP:", error);
            setErrorMessage("Gagal membuat arsip ZIP. Silakan coba kurangi ukuran atau jumlah berkas.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleDownload = () => {
        if (!resultBlob) return;
        const url = URL.createObjectURL(resultBlob);
        const a = document.createElement("a");
        a.href = url;
        const cleanName = archiveName.trim() || "Arsip-DataScry";
        a.download = cleanName.endsWith(".zip") ? cleanName : `${cleanName}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const savingsPercent = totalOriginalSize > 0 && resultSize > 0
        ? Math.round(((totalOriginalSize - resultSize) / totalOriginalSize) * 100)
        : 0;

    const imageItems = files
        .map((item, originalIndex) => ({ item, originalIndex }))
        .filter(({ item }) => item.isImage && !!item.previewUrl);

    const lightboxItems: LightboxItem[] = imageItems.map(({ item }) => ({
        title: item.name,
        url: item.previewUrl || "",
        size: item.size
    }));

    return (
        <div className="space-y-8 w-full">
            {/* Hidden native picker for direct pick */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        handleFilesAccepted(Array.from(e.target.files));
                    }
                }}
            />

            {/* In-App Error Notification Banner */}
            {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 flex items-start justify-between gap-3 animate-fade-in">
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

            {/* Configuration Panel */}
            <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-border/80 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                            <Sliders className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base sm:text-lg text-foreground">Pengaturan Arsip ZIP</h3>
                            <p className="text-xs text-foreground/60">Sesuaikan nama arsip dan level algoritma kompresi</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border/70 text-xs font-semibold text-foreground/70">
                        <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                        <span>Kompresi 100% di Memori RAM Gawai</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Archive File Name Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                            Nama File Hasil (.zip)
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={archiveName}
                                onChange={(e) => setArchiveName(e.target.value)}
                                placeholder="Arsip-DataScry"
                                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border/80 text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            />
                            <span className="text-sm font-bold text-foreground/50">.zip</span>
                        </div>
                    </div>

                    {/* Compression Level Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                            Level Kompresi DEFLATE
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { level: 9 as CompressionLevel, label: "Maksimal (Lvl 9)", desc: "Ukuran Paling Kecil" },
                                { level: 6 as CompressionLevel, label: "Standar (Lvl 6)", desc: "Seimbang & Cepat" },
                                { level: 1 as CompressionLevel, label: "Kilat (Lvl 1)", desc: "Kompresi Ringan" },
                            ].map((opt) => (
                                <button
                                    key={opt.level}
                                    type="button"
                                    onClick={() => {
                                        setCompressionLevel(opt.level);
                                        setResultBlob(null);
                                    }}
                                    className={`p-2.5 rounded-xl border text-center transition-all ${compressionLevel === opt.level
                                        ? "bg-purple-500/15 border-purple-500 text-purple-300 ring-2 ring-purple-500/20"
                                        : "bg-surface/50 border-border/60 hover:bg-surface text-foreground/70"
                                        }`}
                                >
                                    <div className="text-xs font-bold">{opt.label}</div>
                                    <div className="text-[10px] text-foreground/50">{opt.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dropzone & File List */}
            {files.length === 0 ? (
                <div className="animate-fade-in">
                    <Dropzone
                        onFilesAccepted={handleFilesAccepted}
                        accept="*"
                        title="Tarik & Letakkan Berkas Apa Saja ke Sini"
                        description="Mendukung dokumen, PDF, Word, lembar kerja Excel, foto, kode sumber, atau file arsip apa pun tanpa batas kuota."
                        icons={
                            <div className="flex items-center gap-2 text-purple-400 font-semibold">
                                <FolderArchive className="w-5 h-5" />
                                <span>Multi-File & Segala Ekstensi Berkas</span>
                            </div>
                        }
                    />
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    {/* Control Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface/60 border border-border/60 backdrop-blur-md shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                                <FileArchive className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-base text-foreground">
                                    {files.length} Berkas Siap Diarsip
                                </h4>
                                <p className="text-xs text-foreground/60">
                                    Total Ukuran: {formatBytes(totalOriginalSize)}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-foreground/80 hover:text-foreground bg-surface hover:bg-surface/80 border border-border/70 rounded-xl transition-all active:scale-95"
                            >
                                <FolderOpen className="w-4 h-4 text-purple-400" />
                                <span>Tambah Berkas</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-foreground/70 hover:text-rose-400 bg-surface hover:bg-rose-500/10 border border-border/70 hover:border-rose-500/30 rounded-xl transition-all active:scale-95"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Clear / Bersihkan</span>
                            </button>

                            <button
                                type="button"
                                onClick={createZipArchive}
                                disabled={isCreating}
                                className={`inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-white rounded-xl shadow-lg transition-all ${isCreating
                                    ? "bg-purple-500/50 cursor-not-allowed"
                                    : "bg-purple-600 hover:bg-purple-500 shadow-purple-500/25 hover:scale-[1.02] active:scale-95"
                                    }`}
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Memadatkan ({progress}%)...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        <span>Kompres ke .ZIP</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Progress indicator during compression */}
                    {isCreating && (
                        <div className="p-4 rounded-2xl bg-surface/80 border border-purple-500/30 space-y-2 animate-fade-in">
                            <div className="flex justify-between text-xs font-semibold">
                                <span className="text-foreground/70 truncate max-w-xs sm:max-w-md">
                                    Memadatkan: {currentFileTask || "Menyiapkan stream berkas..."}
                                </span>
                                <span className="text-purple-400 font-mono font-bold">{progress}%</span>
                            </div>
                            <div className="w-full bg-surface rounded-full h-2.5 overflow-hidden border border-border/60">
                                <div
                                    className="bg-linear-to-r from-purple-500 to-indigo-500 h-full transition-all duration-150"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Success Download Card */}
                    {resultBlob && (
                        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in shadow-lg">
                            <div className="flex items-center gap-3.5">
                                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 shrink-0">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-foreground">
                                        Arsip ZIP Berhasil Dibuat!
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-foreground/70 mt-1">
                                        <span>Ukuran Hasil: <strong className="text-emerald-400 font-bold">{formatBytes(resultSize)}</strong></span>
                                        <span>•</span>
                                        <span>Dari Asli: {formatBytes(totalOriginalSize)}</span>
                                        {savingsPercent > 0 && (
                                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                                                Hemat {savingsPercent}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleDownload}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/30 rounded-xl transition-all hover:scale-105 active:scale-95"
                            >
                                <Download className="w-4 h-4" />
                                <span>Unduh {archiveName.endsWith(".zip") ? archiveName : `${archiveName}.zip`}</span>
                            </button>
                        </div>
                    )}

                    {/* Files list table */}
                    <div className="glass-panel overflow-hidden rounded-2xl border border-border/60 shadow-xl">
                        <div className="bg-surface/80 p-4 border-b border-border/50 flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                                Daftar Berkas Terpilih ({files.length})
                            </span>
                            <span className="text-xs text-foreground/50">
                                Total: {formatBytes(totalOriginalSize)}
                            </span>
                        </div>
                        <div className="divide-y divide-border/40 max-h-96 overflow-y-auto">
                            {files.map((item, idx) => (
                                <div
                                    key={item.id}
                                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-surface/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-xs font-mono text-foreground/40 w-5 text-right">
                                            {idx + 1}
                                        </span>
                                        {item.isImage && item.previewUrl ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const lIndex = imageItems.findIndex(i => i.item.id === item.id);
                                                    if (lIndex !== -1) setLightboxIndex(lIndex);
                                                }}
                                                className="w-8 h-8 rounded-none border border-purple-500/30 overflow-hidden shrink-0 group/img relative cursor-pointer"
                                                title="Klik untuk pratinjau resolusi penuh (Zoom & Pan)"
                                            >
                                                <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover rounded-none" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white">
                                                    <Eye className="w-3.5 h-3.5" />
                                                </div>
                                            </button>
                                        ) : (
                                            <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                                        )}
                                        <p className="font-semibold text-sm text-foreground truncate max-w-xs sm:max-w-md">
                                            {item.name}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                        {item.isImage && item.previewUrl && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const lIndex = imageItems.findIndex(i => i.item.id === item.id);
                                                    if (lIndex !== -1) setLightboxIndex(lIndex);
                                                }}
                                                className="p-1 text-foreground/40 hover:text-purple-400 hover:bg-purple-500/10 rounded-md transition-colors cursor-pointer"
                                                title="Pratinjau gambar (Zoom & Pan)"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        <span className="text-xs font-mono text-foreground/60">
                                            {formatBytes(item.size)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFile(item.id)}
                                            className="p-1 text-foreground/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
                                            title="Hapus dari daftar"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Media Lightbox Modal for Image Previews */}
            <MediaLightboxModal
                isOpen={lightboxIndex !== null}
                item={lightboxIndex !== null ? lightboxItems[lightboxIndex] : null}
                onClose={() => setLightboxIndex(null)}
                onNavigatePrev={() => lightboxIndex !== null && setLightboxIndex(Math.max(0, lightboxIndex - 1))}
                onNavigateNext={() => lightboxIndex !== null && setLightboxIndex(Math.min(lightboxItems.length - 1, lightboxIndex + 1))}
                hasPrev={lightboxIndex !== null && lightboxIndex > 0}
                hasNext={lightboxIndex !== null && lightboxIndex < lightboxItems.length - 1}
                accentColor="purple"
            />
        </div>
    );
}
