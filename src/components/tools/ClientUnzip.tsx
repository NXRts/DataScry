"use client";

import React, { useState, useRef, useMemo } from "react";
import Dropzone from "@/components/ui/Dropzone";
import JSZip from "jszip";
import {
    FolderOpen,
    FileArchive,
    FileText,
    FileCode,
    Image as ImageIcon,
    File,
    Download,
    Search,
    Eye,
    Check,
    CheckSquare,
    Square,
    RotateCcw,
    Sparkles,
    CheckCircle2,
    HardDrive,
    Folder,
    Calendar,
    Hash,
    LayoutGrid,
    List,
    Copy,
    CheckCheck,
    Maximize2,
    SlidersHorizontal,
    Layers,
    ShieldCheck,
    AlertCircle,
    X,
    FileSpreadsheet,
    Film,
    Music,
    Loader2
} from "lucide-react";
import MediaLightboxModal, { LightboxItem } from "@/components/shared/MediaLightboxModal";

export type FileCategory = "all" | "image" | "pdf" | "text" | "code" | "other";

export interface ZipEntryItem {
    id: string;
    path: string; // full path e.g. "assets/images/logo.png"
    fileName: string; // e.g. "logo.png"
    folderPath: string; // e.g. "assets/images/"
    size: number; // uncompressed byte size
    date: Date;
    extension: string;
    category: FileCategory;
    zipObject: JSZip.JSZipObject;
    previewUrl?: string;
}

export default function ClientUnzip() {
    // State berkas ZIP
    const [zipFile, setZipFile] = useState<File | null>(null);
    const [entries, setEntries] = useState<ZipEntryItem[]>([]);
    const [folderCount, setFolderCount] = useState<number>(0);
    const [totalUncompressedSize, setTotalUncompressedSize] = useState<number>(0);
    const [isLoadingZip, setIsLoadingZip] = useState<boolean>(false);
    const [loadingProgressText, setLoadingProgressText] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Filter, Cari & Tampilan
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<FileCategory>("all");
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Pratinjau Teks Modal
    const [textPreviewModal, setTextPreviewModal] = useState<{
        fileName: string;
        content: string;
        size: number;
    } | null>(null);
    const [isCopied, setIsCopied] = useState<boolean>(false);

    // Pratinjau Media Lightbox Modal
    const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null);

    // State Ekstraksi & Unduhan
    const [isExtracting, setIsExtracting] = useState<boolean>(false);
    const [extractStatusText, setExtractStatusText] = useState<string>("");

    // Cache object URLs untuk cleanup memori
    const objectUrlsRef = useRef<string[]>([]);

    // Tentukan kategori berkas berdasarkan ekstensi
    const getFileCategory = (ext: string): FileCategory => {
        const lower = ext.toLowerCase();
        if (["jpg", "jpeg", "png", "webp", "gif", "svg", "bmp", "ico", "avif"].includes(lower)) return "image";
        if (["pdf"].includes(lower)) return "pdf";
        if (["txt", "md", "csv", "log", "rtf"].includes(lower)) return "text";
        if (["js", "jsx", "ts", "tsx", "html", "css", "json", "xml", "py", "sh", "yaml", "yml", "sql", "c", "cpp", "java", "php", "go", "rs"].includes(lower)) return "code";
        return "other";
    };

    // Bersihkan URL memori
    const cleanupObjectUrls = () => {
        objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        objectUrlsRef.current = [];
    };

    // Parse Berkas ZIP yang Diunggah
    const handleZipAccepted = async (acceptedFiles: File[]) => {
        if (!acceptedFiles || acceptedFiles.length === 0) return;
        const file = acceptedFiles[0];

        cleanupObjectUrls();
        setZipFile(file);
        setEntries([]);
        setSelectedIds(new Set());
        setErrorMessage(null);
        setIsLoadingZip(true);
        setLoadingProgressText("Membaca struktur arsip ZIP...");

        try {
            const zip = new JSZip();
            const loadedZip = await zip.loadAsync(file);

            const items: ZipEntryItem[] = [];
            let folders = 0;
            let uncompressedSum = 0;

            const allPaths = Object.keys(loadedZip.files);
            const total = allPaths.length;

            for (let i = 0; i < total; i++) {
                const path = allPaths[i];
                const entry = loadedZip.files[path];

                if (entry.dir) {
                    folders++;
                    continue;
                }

                // Normalisasi nama berkas dan folder
                const parts = path.split("/");
                const fileName = parts.pop() || path;
                const folderPath = parts.length > 0 ? parts.join("/") + "/" : "";
                const ext = fileName.includes(".") ? fileName.split(".").pop() || "" : "";
                const category = getFileCategory(ext);

                // @ts-expect-error _data exists on internal JSZip object
                const uncompressedSize = entry._data?.uncompressedSize || 0;
                uncompressedSum += uncompressedSize;

                items.push({
                    id: `entry-${i}-${path}`,
                    path,
                    fileName,
                    folderPath,
                    size: uncompressedSize,
                    date: entry.date || new Date(),
                    extension: ext,
                    category,
                    zipObject: entry
                });
            }

            setFolderCount(folders);
            setTotalUncompressedSize(uncompressedSum);
            setEntries(items);
        } catch (err: unknown) {
            console.error("Gagal membuka ZIP:", err);
            setErrorMessage("Berkas ZIP rusak atau format kompresi tidak didukung. Pastikan berkas berformat .ZIP valid.");
        } finally {
            setIsLoadingZip(false);
            setLoadingProgressText("");
        }
    };

    // Reset Semua (Clean Reset Lifecycle)
    const handleResetAll = () => {
        cleanupObjectUrls();
        setZipFile(null);
        setEntries([]);
        setFolderCount(0);
        setTotalUncompressedSize(0);
        setSelectedIds(new Set());
        setSearchQuery("");
        setErrorMessage(null);
        setTextPreviewModal(null);
        setLightboxItem(null);
    };

    // Filter & Search memoized
    const filteredEntries = useMemo(() => {
        return entries.filter((item) => {
            const matchesSearch =
                searchQuery.trim() === "" ||
                item.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.fileName.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory =
                selectedCategory === "all" || item.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [entries, searchQuery, selectedCategory]);

    // Format Byte Size
    const formatBytes = (bytes: number) => {
        if (!bytes || bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    // Hitung Rasio Hemat Kompresi
    const savingsRatio = useMemo(() => {
        if (!zipFile || totalUncompressedSize <= 0) return 0;
        const saved = totalUncompressedSize - zipFile.size;
        return Math.max(0, Math.round((saved / totalUncompressedSize) * 100));
    }, [zipFile, totalUncompressedSize]);

    // Handle Seleksi Checkbox
    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAllFiltered = () => {
        const next = new Set(selectedIds);
        filteredEntries.forEach((e) => next.add(e.id));
        setSelectedIds(next);
    };

    const clearSelection = () => {
        setSelectedIds(new Set());
    };

    // Buka Pratinjau Berkas (Intip Tanpa Ekstrak ke Disk)
    const handlePreviewEntry = async (item: ZipEntryItem) => {
        if (item.category === "image") {
            try {
                let url = item.previewUrl;
                if (!url) {
                    const blob = await item.zipObject.async("blob");
                    url = URL.createObjectURL(blob);
                    objectUrlsRef.current.push(url);
                    item.previewUrl = url;
                }
                setLightboxItem({
                    url,
                    title: item.fileName,
                    size: item.size
                });
            } catch (err) {
                console.error("Gagal memuat pratinjau gambar:", err);
            }
        } else if (item.category === "text" || item.category === "code") {
            try {
                const text = await item.zipObject.async("string");
                setTextPreviewModal({
                    fileName: item.fileName,
                    content: text,
                    size: item.size
                });
                setIsCopied(false);
            } catch (err) {
                console.error("Gagal membaca teks:", err);
            }
        } else if (item.category === "pdf") {
            try {
                const blob = await item.zipObject.async("blob");
                const url = URL.createObjectURL(blob);
                objectUrlsRef.current.push(url);
                window.open(url, "_blank");
            } catch (err) {
                console.error("Gagal membuka PDF:", err);
            }
        }
    };

    // Unduh Satu Berkas Terpilih Langsung
    const handleDownloadSingle = async (item: ZipEntryItem) => {
        try {
            const blob = await item.zipObject.async("blob");
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = item.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Gagal mengunduh berkas:", err);
        }
    };

    // Ekstrak Berkas Terpilih / Semua Berkas
    const handleExtractSelected = async () => {
        const targetItems =
            selectedIds.size > 0
                ? entries.filter((e) => selectedIds.has(e.id))
                : filteredEntries;

        if (targetItems.length === 0) return;

        // Jika hanya 1 berkas, langsung unduh berkas aslinya
        if (targetItems.length === 1) {
            await handleDownloadSingle(targetItems[0]);
            return;
        }

        // Jika banyak berkas, bungkus menjadi ZIP baru
        setIsExtracting(true);
        setExtractStatusText(`Menyiapkan ${targetItems.length} berkas pilihan...`);

        try {
            const newZip = new JSZip();

            for (let i = 0; i < targetItems.length; i++) {
                const item = targetItems[i];
                setExtractStatusText(`Mengekstrak (${i + 1}/${targetItems.length}): ${item.fileName}...`);
                const blob = await item.zipObject.async("blob");
                newZip.file(item.path, blob);
            }

            setExtractStatusText("Membuat arsip ZIP hasil ekstraksi...");
            const resultBlob = await newZip.generateAsync({
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: { level: 6 }
            });

            const zipBaseName = zipFile?.name.replace(/\.[^/.]+$/, "") || "arsip";
            const downloadName = `${zipBaseName}-ekstrak.zip`;

            const url = URL.createObjectURL(resultBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = downloadName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Gagal mengekstrak berkas terpilih:", err);
        } finally {
            setIsExtracting(false);
            setExtractStatusText("");
        }
    };

    // Salin Teks ke Clipboard
    const handleCopyText = async () => {
        if (!textPreviewModal) return;
        try {
            await navigator.clipboard.writeText(textPreviewModal.content);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error("Gagal menyalin teks:", err);
        }
    };

    // Ikon Kategori Berkas
    const renderCategoryIcon = (category: FileCategory, ext: string) => {
        switch (category) {
            case "image":
                return <ImageIcon className="w-4 h-4 text-emerald-400" />;
            case "pdf":
                return <FileText className="w-4 h-4 text-rose-500" />;
            case "text":
                return <FileText className="w-4 h-4 text-amber-400" />;
            case "code":
                return <FileCode className="w-4 h-4 text-sky-400" />;
            default:
                if (["mp4", "mkv", "mov"].includes(ext)) return <Film className="w-4 h-4 text-purple-400" />;
                if (["mp3", "wav", "aac"].includes(ext)) return <Music className="w-4 h-4 text-pink-400" />;
                if (["xlsx", "xls", "csv"].includes(ext)) return <FileSpreadsheet className="w-4 h-4 text-teal-400" />;
                return <File className="w-4 h-4 text-foreground/50" />;
        }
    };

    return (
        <div className="space-y-8">
            {/* 1. DROPZONE TAMPILAN AWAL */}
            {!zipFile ? (
                <div className="space-y-6">
                    <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-border/80 shadow-2xl relative overflow-hidden">
                        <div className="max-w-2xl mx-auto space-y-6">
                            <Dropzone
                                onFilesAccepted={handleZipAccepted}
                                accept=".zip,application/zip,application/x-zip-compressed"
                                title="Pilih atau Tarik Berkas .ZIP ke Sini"
                                description="Buka dan intip isi berkas ZIP tanpa perlu diekstrak ke disk. 100% lokal & aman di peramban Anda."
                                icons={<FolderOpen className="w-12 h-12 text-fuchsia-500" />}
                            />

                            {isLoadingZip && (
                                <div className="p-4 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-center space-y-2">
                                    <Loader2 className="w-6 h-6 animate-spin text-fuchsia-400 mx-auto" />
                                    <p className="text-xs font-semibold text-fuchsia-300">{loadingProgressText}</p>
                                </div>
                            )}

                            {errorMessage && (
                                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-xs text-rose-300">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Kartu Informasi Fitur Unzip */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="glass-card p-5 rounded-2xl border border-border/60 space-y-2">
                            <div className="w-9 h-9 rounded-xl bg-fuchsia-500/10 text-fuchsia-400 flex items-center justify-center font-bold">
                                1
                            </div>
                            <h3 className="font-bold text-foreground text-sm">Intip Tanpa Ekstrak</h3>
                            <p className="text-xs text-foreground/60 leading-relaxed">
                                Buka pratinjau gambar, dokumen PDF, dan berkas kode langsung di browser tanpa membebani memori penyimpanan perangkat Anda.
                            </p>
                        </div>
                        <div className="glass-card p-5 rounded-2xl border border-border/60 space-y-2">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                                2
                            </div>
                            <h3 className="font-bold text-foreground text-sm">Ekstraksi Selektif</h3>
                            <p className="text-xs text-foreground/60 leading-relaxed">
                                Cukup unduh satu atau beberapa berkas yang Anda perlukan saja tanpa harus mengekstrak seluruh arsip yang besar.
                            </p>
                        </div>
                        <div className="glass-card p-5 rounded-2xl border border-border/60 space-y-2">
                            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
                                3
                            </div>
                            <h3 className="font-bold text-foreground text-sm">Sandbox Bebas Malware</h3>
                            <p className="text-xs text-foreground/60 leading-relaxed">
                                Berkas diproses dalam lingkungan sandbox peramban tanpa risiko eksekusi file mencurigakan ke sistem operasi komputer/ponsel.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                /* 2. DASHBOARD & PENJELAJAH ISI ARSIP ZIP */
                <div className="space-y-6">
                    {/* Top HUD Panel: Metadata Arsip ZIP */}
                    <div className="glass-panel p-5 rounded-3xl border border-border/80 shadow-xl space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30 flex items-center justify-center">
                                    <FileArchive className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-black text-foreground truncate max-w-xs sm:max-w-md">
                                        {zipFile.name}
                                    </h2>
                                    <p className="text-xs text-foreground/60">
                                        Ukuran Arsip: <span className="font-mono font-bold text-foreground">{formatBytes(zipFile.size)}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleResetAll}
                                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface border border-border/80 text-foreground/70 hover:text-rose-400 hover:border-rose-500/40 transition-colors flex items-center gap-1.5"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Tutup Arsip</span>
                                </button>
                            </div>
                        </div>

                        {/* Statistik Grid HUD */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/40">
                            <div className="p-3 rounded-2xl bg-surface/60 border border-border/60">
                                <span className="text-[11px] text-foreground/50 block">Total Berkas</span>
                                <span className="text-base sm:text-lg font-mono font-bold text-foreground">
                                    {entries.length} file
                                </span>
                            </div>
                            <div className="p-3 rounded-2xl bg-surface/60 border border-border/60">
                                <span className="text-[11px] text-foreground/50 block">Total Folder</span>
                                <span className="text-base sm:text-lg font-mono font-bold text-foreground">
                                    {folderCount} folder
                                </span>
                            </div>
                            <div className="p-3 rounded-2xl bg-surface/60 border border-border/60">
                                <span className="text-[11px] text-foreground/50 block">Ukuran Asli Uncompressed</span>
                                <span className="text-base sm:text-lg font-mono font-bold text-foreground">
                                    {formatBytes(totalUncompressedSize)}
                                </span>
                            </div>
                            <div className="p-3 rounded-2xl bg-surface/60 border border-border/60">
                                <span className="text-[11px] text-foreground/50 block">Efisiensi Kompresi</span>
                                <span className="text-base sm:text-lg font-mono font-bold text-emerald-400">
                                    Hemat {savingsRatio}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar Pencarian, Filter Kategori & Mode Tampilan */}
                    <div className="glass-panel p-4 rounded-3xl border border-border/80 space-y-4 shadow-lg">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            {/* Search Bar Input */}
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari nama berkas atau jalur folder..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface border border-border/80 text-xs text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-fuchsia-500/50"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-foreground/40 hover:text-foreground"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Tombol Ganti Mode Tampilan (List vs Grid) */}
                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setViewMode("list")}
                                    className={`p-2.5 rounded-xl border text-xs transition-colors ${
                                        viewMode === "list"
                                            ? "bg-fuchsia-500/15 border-fuchsia-500/50 text-fuchsia-400"
                                            : "bg-surface border-border/60 text-foreground/60 hover:bg-surface-hover"
                                    }`}
                                    title="Tampilan Tabel Berkas"
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2.5 rounded-xl border text-xs transition-colors ${
                                        viewMode === "grid"
                                            ? "bg-fuchsia-500/15 border-fuchsia-500/50 text-fuchsia-400"
                                            : "bg-surface border-border/60 text-foreground/60 hover:bg-surface-hover"
                                    }`}
                                    title="Tampilan Kisi Kartu"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Filter Tabs Kategori */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                            {[
                                { id: "all", label: `Semua (${entries.length})` },
                                { id: "image", label: `Gambar (${entries.filter((e) => e.category === "image").length})` },
                                { id: "pdf", label: `PDF (${entries.filter((e) => e.category === "pdf").length})` },
                                { id: "text", label: `Teks (${entries.filter((e) => e.category === "text").length})` },
                                { id: "code", label: `Kode (${entries.filter((e) => e.category === "code").length})` },
                                { id: "other", label: `Lainnya (${entries.filter((e) => e.category === "other").length})` }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(tab.id as FileCategory)}
                                    className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
                                        selectedCategory === tab.id
                                            ? "bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/20 font-bold"
                                            : "bg-surface border border-border/60 text-foreground/70 hover:bg-surface-hover"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Batch Actions Bar (Seleksi & Ekstraksi Cepat) */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-foreground/70">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={selectAllFiltered}
                                className="px-3 py-1.5 rounded-xl bg-surface border border-border/60 hover:bg-surface-hover transition-colors font-medium flex items-center gap-1.5"
                            >
                                <CheckSquare className="w-3.5 h-3.5 text-fuchsia-400" />
                                <span>Pilih Semua Hasil ({filteredEntries.length})</span>
                            </button>
                            {selectedIds.size > 0 && (
                                <button
                                    type="button"
                                    onClick={clearSelection}
                                    className="px-3 py-1.5 rounded-xl bg-surface border border-border/60 hover:bg-surface-hover transition-colors text-foreground/60"
                                >
                                    Batal ({selectedIds.size})
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleExtractSelected}
                            disabled={isExtracting || filteredEntries.length === 0}
                            className="px-5 py-2 rounded-xl bg-linear-to-r from-fuchsia-600 to-fuchsia-500 hover:from-fuchsia-500 hover:to-fuchsia-600 text-white font-bold shadow-lg shadow-fuchsia-500/20 hover:shadow-fuchsia-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isExtracting ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>{extractStatusText || "Mengekstrak..."}</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-3.5 h-3.5" />
                                    <span>
                                        {selectedIds.size > 0
                                            ? `Ekstrak Terpilih (${selectedIds.size} Berkas)`
                                            : `Ekstrak Seluruh Hasil (${filteredEntries.length} Berkas)`}
                                    </span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* DAFTAR BERKAS (VIEW MODE: LIST / GRID) */}
                    {filteredEntries.length === 0 ? (
                        <div className="glass-panel p-12 rounded-3xl border border-border/80 text-center space-y-3">
                            <FolderOpen className="w-12 h-12 text-foreground/20 mx-auto" />
                            <h3 className="font-bold text-sm text-foreground">Tidak Ada Berkas yang Cocok</h3>
                            <p className="text-xs text-foreground/50">
                                Coba ubah kata kunci pencarian atau ganti filter kategori berkas di atas.
                            </p>
                        </div>
                    ) : viewMode === "list" ? (
                        /* LIST TABLE VIEW */
                        <div className="glass-panel rounded-3xl border border-border/80 overflow-hidden shadow-xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-surface/90 border-b border-border/80 text-foreground/60 uppercase text-[10px] tracking-wider font-bold">
                                        <tr>
                                            <th className="py-3 px-4 w-10 text-center">
                                                <span className="sr-only">Pilih</span>
                                            </th>
                                            <th className="py-3 px-4">Nama Berkas & Lokasi Folder</th>
                                            <th className="py-3 px-4 w-28 text-right">Ukuran</th>
                                            <th className="py-3 px-4 w-32 hidden sm:table-cell text-right">Tanggal</th>
                                            <th className="py-3 px-4 w-28 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {filteredEntries.map((item) => {
                                            const isSelected = selectedIds.has(item.id);
                                            const canPreview = ["image", "text", "code", "pdf"].includes(item.category);

                                            return (
                                                <tr
                                                    key={item.id}
                                                    className={`hover:bg-surface/70 transition-colors ${
                                                        isSelected ? "bg-fuchsia-500/10" : ""
                                                    }`}
                                                >
                                                    {/* Checkbox */}
                                                    <td className="py-3 px-4 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSelect(item.id)}
                                                            className="text-foreground/40 hover:text-fuchsia-400"
                                                        >
                                                            {isSelected ? (
                                                                <CheckSquare className="w-4 h-4 text-fuchsia-400" />
                                                            ) : (
                                                                <Square className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </td>

                                                    {/* File Info */}
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2.5">
                                                            {renderCategoryIcon(item.category, item.extension)}
                                                            <div className="truncate max-w-xs sm:max-w-md">
                                                                <span className="font-semibold text-foreground block truncate">
                                                                    {item.fileName}
                                                                </span>
                                                                {item.folderPath && (
                                                                    <span className="text-[10px] text-foreground/40 font-mono block truncate">
                                                                        {item.folderPath}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Ukuran */}
                                                    <td className="py-3 px-4 text-right font-mono text-foreground/80">
                                                        {formatBytes(item.size)}
                                                    </td>

                                                    {/* Tanggal */}
                                                    <td className="py-3 px-4 text-right text-foreground/50 font-mono text-[11px] hidden sm:table-cell">
                                                        {item.date ? item.date.toLocaleDateString("id-ID") : "-"}
                                                    </td>

                                                    {/* Tombol Aksi */}
                                                    <td className="py-3 px-4 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {canPreview && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handlePreviewEntry(item)}
                                                                    className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border/60 text-foreground/70 hover:text-fuchsia-400 transition-colors"
                                                                    title="Pratinjau / Intip Berkas"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDownloadSingle(item)}
                                                                className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border/60 text-foreground/70 hover:text-emerald-400 transition-colors"
                                                                title="Unduh Berkas Ini Saja"
                                                            >
                                                                <Download className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* GRID CARDS VIEW */
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {filteredEntries.map((item) => {
                                const isSelected = selectedIds.has(item.id);
                                const canPreview = ["image", "text", "code", "pdf"].includes(item.category);

                                return (
                                    <div
                                        key={item.id}
                                        className={`glass-card p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                                            isSelected
                                                ? "border-fuchsia-500/80 bg-fuchsia-500/10 ring-1 ring-fuchsia-500/40"
                                                : "border-border/60 hover:border-border hover:bg-surface"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="w-9 h-9 rounded-xl bg-surface border border-border/60 flex items-center justify-center">
                                                {renderCategoryIcon(item.category, item.extension)}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => toggleSelect(item.id)}
                                                className="p-1 text-foreground/40 hover:text-fuchsia-400"
                                            >
                                                {isSelected ? (
                                                    <CheckSquare className="w-4 h-4 text-fuchsia-400" />
                                                ) : (
                                                    <Square className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="font-semibold text-xs text-foreground truncate" title={item.fileName}>
                                                {item.fileName}
                                            </p>
                                            <p className="text-[10px] text-foreground/40 font-mono truncate">
                                                {item.folderPath || "Root"} • {formatBytes(item.size)}
                                            </p>
                                        </div>

                                        <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                                            {canPreview ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handlePreviewEntry(item)}
                                                    className="px-2.5 py-1 rounded-lg bg-surface border border-border/60 hover:bg-surface-hover text-[11px] font-medium text-foreground/70 hover:text-fuchsia-400 transition-colors flex items-center gap-1"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    <span>Intip</span>
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-foreground/30 font-mono uppercase">
                                                    .{item.extension || "bin"}
                                                </span>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => handleDownloadSingle(item)}
                                                className="p-1.5 rounded-lg bg-surface border border-border/60 hover:bg-surface-hover text-foreground/70 hover:text-emerald-400 transition-colors"
                                                title="Unduh Berkas Ini"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* MODAL PRATINJAU TEKS / KODE */}
            {textPreviewModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="glass-panel w-full max-w-3xl max-h-[85vh] rounded-3xl border border-border/80 shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-200">
                        {/* Header Modal */}
                        <div className="p-4 border-b border-border/60 flex items-center justify-between gap-3 bg-surface/80">
                            <div className="flex items-center gap-2.5">
                                <FileCode className="w-5 h-5 text-fuchsia-400" />
                                <div>
                                    <h4 className="font-bold text-sm text-foreground truncate max-w-sm">
                                        {textPreviewModal.fileName}
                                    </h4>
                                    <p className="text-[10px] text-foreground/50">
                                        {formatBytes(textPreviewModal.size)} • Pratinjau Teks Client-Side
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleCopyText}
                                    className="px-3 py-1.5 rounded-xl bg-surface border border-border/60 hover:bg-surface-hover text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                >
                                    {isCopied ? (
                                        <>
                                            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-emerald-400">Tersalin!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Salin Teks</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTextPreviewModal(null)}
                                    className="p-1.5 rounded-xl hover:bg-surface text-foreground/60 hover:text-foreground"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="p-4 overflow-auto flex-1 bg-black/50 font-mono text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap select-text">
                            {textPreviewModal.content}
                        </div>
                    </div>
                </div>
            )}

            {/* LIGHTBOX FULLSCREEN MEDIA INSPECTION */}
            {lightboxItem && (
                <MediaLightboxModal
                    isOpen={Boolean(lightboxItem)}
                    item={lightboxItem}
                    onClose={() => setLightboxItem(null)}
                    accentColor="purple"
                />
            )}
        </div>
    );
}
