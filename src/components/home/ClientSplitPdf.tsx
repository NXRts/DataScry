"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Dropzone from "@/components/ui/Dropzone";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import {
    Scissors,
    Sparkles,
    FileText,
    Check,
    CheckCircle2,
    RotateCcw,
    Download,
    Eye,
    FolderArchive,
    AlertCircle,
    X,
    Layers,
    ListChecks,
    Grid,
    ZoomIn
} from "lucide-react";
import MediaLightboxModal, { LightboxItem } from "@/components/shared/MediaLightboxModal";
import PdfEmbeddedViewer from "@/components/shared/PdfEmbeddedViewer";
import CustomDropdownSelect, { CustomDropdownOption } from "@/components/shared/CustomDropdownSelect";

// Configure PDF.js worker using local public worker
if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

interface SplitPdfPageThumbnail {
    pageNumber: number;
    dataUrl: string;
    width: number;
    height: number;
    aspectRatio: string;
}

type SplitMode = "extract-merged" | "extract-separate" | "all-separate";

export default function ClientSplitPdf() {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pages, setPages] = useState<SplitPdfPageThumbnail[]>([]);
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
    const [pageRange, setPageRange] = useState<string>("");
    const [splitMode, setSplitMode] = useState<SplitMode>("extract-merged");
    
    // Processing states
    const [isLoadingPages, setIsLoadingPages] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [processPercent, setProcessPercent] = useState<number>(0);
    const [processStatus, setProcessStatus] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Results
    const [extractedPdfBlob, setExtractedPdfBlob] = useState<Blob | null>(null);
    const [extractedZipBlob, setExtractedZipBlob] = useState<Blob | null>(null);
    const [individualPdfs, setIndividualPdfs] = useState<{ pageNumber: number; blob: Blob; url: string; fileName: string }[]>([]);

    // Lightbox Preview State
    const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Clean up blob URLs when individualPdfs change or unmount
    useEffect(() => {
        return () => {
            individualPdfs.forEach(item => URL.revokeObjectURL(item.url));
        };
    }, [individualPdfs]);

    const formatAspectRatio = (width: number, height: number): string => {
        const ratio = width / height;
        if (Math.abs(ratio - 16 / 9) < 0.08) return "16:9 Landscape";
        if (Math.abs(ratio - 9 / 16) < 0.08) return "9:16 Portrait";
        if (Math.abs(ratio - 1 / 1.414) < 0.08) return "A4 Portrait";
        if (Math.abs(ratio - 1.414 / 1) < 0.08) return "A4 Landscape";
        if (Math.abs(ratio - 4 / 3) < 0.08) return "4:3 Standard";
        return ratio >= 1 ? "Landscape" : "Portrait";
    };

    // Load PDF and render thumbnails
    const handleFiles = async (newFiles: File[]) => {
        const pdfs = newFiles.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
        if (pdfs.length === 0) {
            setErrorMessage("Silakan pilih dokumen dengan format PDF yang valid.");
            return;
        }

        const targetFile = pdfs[0];
        setPdfFile(targetFile);
        setIsLoadingPages(true);
        setErrorMessage(null);
        setPages([]);
        setSelectedPages(new Set());
        setPageRange("");
        setExtractedPdfBlob(null);
        setExtractedZipBlob(null);
        setIndividualPdfs([]);
        setLoadingProgress("Membuka dokumen PDF...");

        try {
            const arrayBuffer = await targetFile.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
            const pdf = await loadingTask.promise;
            const totalPages = pdf.numPages;

            const loadedThumbs: SplitPdfPageThumbnail[] = [];
            const defaultSelected = new Set<number>();

            for (let i = 1; i <= totalPages; i++) {
                setLoadingProgress(`Merender pratinjau halaman ${i} dari ${totalPages}...`);
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 0.65 });

                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                if (context) {
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    await page.render({ canvasContext: context, viewport, canvas }).promise;
                    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

                    loadedThumbs.push({
                        pageNumber: i,
                        dataUrl,
                        width: Math.round(viewport.width / 0.65),
                        height: Math.round(viewport.height / 0.65),
                        aspectRatio: formatAspectRatio(viewport.width, viewport.height)
                    });
                } else {
                    loadedThumbs.push({
                        pageNumber: i,
                        dataUrl: "",
                        width: 595,
                        height: 842,
                        aspectRatio: "A4 Portrait"
                    });
                }

                defaultSelected.add(i);
            }

            setPages(loadedThumbs);
            setSelectedPages(defaultSelected);
            updateRangeText(defaultSelected, totalPages);
        } catch (error) {
            console.error("Error loading PDF for split:", error);
            setErrorMessage("Gagal memuat pratinjau halaman PDF. Pastikan file tidak rusak atau terkunci.");
            setPdfFile(null);
        } finally {
            setIsLoadingPages(false);
            setLoadingProgress("");
        }
    };

    // Helper: update range text from a set of page numbers
    const updateRangeText = (selectedSet: Set<number>, total: number) => {
        if (selectedSet.size === 0) {
            setPageRange("");
            return;
        }
        if (selectedSet.size === total) {
            setPageRange(`1-${total}`);
            return;
        }

        const sorted = Array.from(selectedSet).sort((a, b) => a - b);
        const ranges: string[] = [];
        let start = sorted[0];
        let prev = sorted[0];

        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] === prev + 1) {
                prev = sorted[i];
            } else {
                ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
                start = sorted[i];
                prev = sorted[i];
            }
        }
        ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
        setPageRange(ranges.join(", "));
    };

    // Toggle individual page selection
    const togglePageSelection = (pageNum: number) => {
        setSelectedPages(prev => {
            const next = new Set(prev);
            if (next.has(pageNum)) {
                next.delete(pageNum);
            } else {
                next.add(pageNum);
            }
            updateRangeText(next, pages.length);
            return next;
        });
    };

    // Select all pages
    const selectAllPages = () => {
        const allSet = new Set<number>();
        pages.forEach(p => allSet.add(p.pageNumber));
        setSelectedPages(allSet);
        updateRangeText(allSet, pages.length);
    };

    // Clear all selection
    const deselectAllPages = () => {
        setSelectedPages(new Set());
        setPageRange("");
    };

    // Parse input text range into selected set
    const handleRangeInputChange = (text: string) => {
        setPageRange(text);
        if (!text.trim()) {
            setSelectedPages(new Set());
            return;
        }

        const totalPages = pages.length;
        const newSet = new Set<number>();
        const chunks = text.split(",").map(s => s.trim()).filter(Boolean);

        for (const c of chunks) {
            if (c.includes("-")) {
                const [startStr, endStr] = c.split("-");
                const start = parseInt(startStr, 10);
                const end = parseInt(endStr, 10);
                if (!isNaN(start) && !isNaN(end) && start > 0 && start <= end) {
                    for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
                        newSet.add(p);
                    }
                }
            } else {
                const pageNum = parseInt(c, 10);
                if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                    newSet.add(pageNum);
                }
            }
        }

        setSelectedPages(newSet);
    };

    // Reset everything
    const handleClearAll = () => {
        setPdfFile(null);
        setPages([]);
        setSelectedPages(new Set());
        setPageRange("");
        setExtractedPdfBlob(null);
        setExtractedZipBlob(null);
        setIndividualPdfs([]);
        setErrorMessage(null);
        setIsLoadingPages(false);
        setIsProcessing(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Lightbox handlers
    const openLightbox = (index: number) => {
        const p = pages[index];
        if (!p) return;
        setLightboxIndex(index);
        setLightboxItem({
            url: p.dataUrl,
            title: `Halaman ${p.pageNumber} (${pdfFile?.name || "Dokumen PDF"})`,
            pageNumber: p.pageNumber,
            totalPages: pages.length,
            width: p.width,
            height: p.height,
            aspectRatio: p.aspectRatio
        });
    };

    const navigateLightbox = (nextIndex: number) => {
        if (nextIndex < 0 || nextIndex >= pages.length) return;
        openLightbox(nextIndex);
    };

    // Execute split
    const executeSplit = async () => {
        if (!pdfFile || pages.length === 0) return;

        let targetIndices: number[] = [];

        if (splitMode === "all-separate") {
            targetIndices = pages.map((_, idx) => idx);
        } else {
            if (selectedPages.size === 0) {
                setErrorMessage("Silakan pilih minimal 1 halaman untuk diekstrak.");
                return;
            }
            targetIndices = Array.from(selectedPages)
                .sort((a, b) => a - b)
                .map(p => p - 1); // 0-indexed
        }

        setIsProcessing(true);
        setProcessPercent(10);
        setProcessStatus("Mempersiapkan dokumen...");
        setErrorMessage(null);
        setExtractedPdfBlob(null);
        setExtractedZipBlob(null);
        setIndividualPdfs([]);

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const sourceDoc = await PDFDocument.load(arrayBuffer);
            const baseName = pdfFile.name.replace(/\.pdf$/i, "");

            if (splitMode === "extract-merged") {
                // Mode 1: Merge selected pages into one new PDF
                setProcessStatus(`Mengekstrak ${targetIndices.length} halaman ke dokumen baru...`);
                setProcessPercent(40);

                const newDoc = await PDFDocument.create();
                const copiedPages = await newDoc.copyPages(sourceDoc, targetIndices);
                copiedPages.forEach(p => newDoc.addPage(p));

                setProcessPercent(85);
                setProcessStatus("Menyimpan berkas PDF hasil ekstrak...");

                const pdfBytes = await newDoc.save();
                const resultBlob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
                setExtractedPdfBlob(resultBlob);
                setProcessPercent(100);
            } else {
                // Mode 2 & 3: Save as individual pages & ZIP
                const zip = new JSZip();
                const generatedList: { pageNumber: number; blob: Blob; url: string; fileName: string }[] = [];
                const total = targetIndices.length;

                for (let i = 0; i < total; i++) {
                    const pageIndex = targetIndices[i];
                    const pageNum = pageIndex + 1;
                    const percent = Math.round(20 + ((i + 1) / total) * 60);
                    setProcessPercent(percent);
                    setProcessStatus(`Membuat PDF halaman ${pageNum} (${i + 1}/${total})...`);

                    const singleDoc = await PDFDocument.create();
                    const [copied] = await singleDoc.copyPages(sourceDoc, [pageIndex]);
                    singleDoc.addPage(copied);

                    const bytes = await singleDoc.save();
                    const singleBlob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
                    const singleUrl = URL.createObjectURL(singleBlob);
                    const singleFileName = `${baseName}_hal_${pageNum}.pdf`;

                    zip.file(singleFileName, bytes);
                    generatedList.push({
                        pageNumber: pageNum,
                        blob: singleBlob,
                        url: singleUrl,
                        fileName: singleFileName
                    });
                }

                setProcessStatus("Mengemas berkas ke dalam arsip ZIP...");
                setProcessPercent(90);

                const zipContent = await zip.generateAsync({ type: "blob" });
                setExtractedZipBlob(zipContent);
                setIndividualPdfs(generatedList);
                setProcessPercent(100);
            }
        } catch (error) {
            console.error("Error executing split:", error);
            setErrorMessage("Terjadi kesalahan saat memproses pemisahan PDF. Silakan coba kembali.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadZip = () => {
        if (!extractedZipBlob || !pdfFile) return;
        const url = URL.createObjectURL(extractedZipBlob);
        const a = document.createElement("a");
        a.href = url;
        const baseName = pdfFile.name.replace(/\.pdf$/i, "");
        a.download = `${baseName}_terpisah_${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadSinglePagePdf = (item: { blob: Blob; fileName: string }) => {
        const url = URL.createObjectURL(item.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = item.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const splitModeOptions: CustomDropdownOption[] = [
        {
            id: "extract-merged",
            label: "Ekstrak ke 1 File PDF Baru",
            badge: "Paling Populer",
            description: "Gabungkan hanya halaman-halaman yang dipilih menjadi satu dokumen PDF baru.",
            icon: <FileText className="w-4 h-4 text-rose-500" />
        },
        {
            id: "extract-separate",
            label: "Pisah Halaman Terpilih (ZIP)",
            badge: "Multi File",
            description: "Halaman yang dipilih masing-masing dijadikan file PDF terpisah dalam satu arsip ZIP.",
            icon: <FolderArchive className="w-4 h-4 text-rose-500" />
        },
        {
            id: "all-separate",
            label: "Pisahkan Semua Halaman (ZIP)",
            badge: "Semua",
            description: "Setiap halaman dalam seluruh dokumen dijadikan file PDF individual dalam arsip ZIP.",
            icon: <Scissors className="w-4 h-4 text-rose-500" />
        }
    ];

    return (
        <div className="space-y-8 w-full max-w-5xl mx-auto">
            {/* Hidden Input for direct file picking */}
            <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        handleFiles(Array.from(e.target.files));
                    }
                }}
            />

            {/* In-App Error Notification */}
            {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start justify-between gap-3 text-rose-400 animate-fade-in shadow-lg">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                        <span className="text-sm font-semibold">{errorMessage}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setErrorMessage(null)}
                        className="p-1 hover:bg-rose-500/20 rounded-lg text-rose-400 transition-colors"
                        title="Tutup pesan"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* State 1: Dropzone Belum Memilih File */}
            {!pdfFile ? (
                <Dropzone
                    onFilesAccepted={handleFiles}
                    accept="application/pdf"
                    title="Upload PDF untuk Dipisahkan"
                    description="Pilih satu dokumen PDF yang ingin Anda ekstrak halamannya. 100% diproses langsung di peramban Anda."
                    icons={
                        <div className="flex items-center gap-2">
                            <Scissors className="w-5 h-5 text-rose-500" />
                            <span className="text-rose-500 font-bold">Dokumen PDF</span>
                        </div>
                    }
                />
            ) : (
                /* State 2: Berkas Dipilih & Grid Halaman */
                <div className="space-y-6 animate-fade-in">
                    {/* Header Berkas Terpilih & Clear Data */}
                    <div className="p-4 sm:p-6 glass-panel rounded-2xl border border-rose-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-xl shrink-0 shadow-inner">
                                <Scissors className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-xl font-bold truncate max-w-xs sm:max-w-md md:max-w-lg text-foreground">
                                    {pdfFile.name}
                                </h2>
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground/60">
                                    <span>{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                    <span>•</span>
                                    <span className="font-semibold text-rose-400">
                                        {pages.length > 0 ? `${pages.length} Halaman` : "Membaca..."}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Tombol Clear Data & Ganti Berkas */}
                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3.5 py-2 rounded-xl bg-surface/80 border border-border/80 hover:bg-surface text-foreground/80 hover:text-foreground text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                            >
                                Ganti Berkas
                            </button>
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Hapus berkas dan reset formulir"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Clear Semua</span>
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar saat loading awal halaman */}
                    {isLoadingPages && (
                        <div className="p-6 rounded-2xl glass-panel border border-border space-y-3 text-center animate-fade-in">
                            <div className="flex items-center justify-center gap-2 text-rose-400 font-semibold text-sm">
                                <Sparkles className="w-4 h-4 animate-spin" />
                                <span>{loadingProgress || "Memproses halaman..."}</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-surface overflow-hidden">
                                <div className="h-full bg-rose-500 animate-pulse w-3/4 rounded-full" />
                            </div>
                        </div>
                    )}

                    {/* Panel Konfigurasi Mode Pemisahan */}
                    {pages.length > 0 && (
                        <div className="p-4 sm:p-6 glass-panel rounded-2xl border border-border space-y-6 shadow-xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Pilihan Mode Dropdown */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-foreground/80 tracking-wide uppercase">
                                        Metode Pemisahan PDF
                                    </label>
                                    <CustomDropdownSelect
                                        value={splitMode}
                                        onChange={(val) => setSplitMode(val as SplitMode)}
                                        options={splitModeOptions}
                                        accentColor="rose"
                                    />
                                </div>

                                {/* Input Rentang Halaman Manual */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold text-foreground/80 tracking-wide uppercase">
                                            Rentang Halaman yang Dipilih
                                        </label>
                                        <span className="text-xs font-semibold text-rose-400">
                                            {splitMode === "all-separate"
                                                ? `Semua (${pages.length})`
                                                : `${selectedPages.size} dari ${pages.length} dipilih`}
                                        </span>
                                    </div>

                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={splitMode === "all-separate" ? `1-${pages.length}` : pageRange}
                                            disabled={splitMode === "all-separate"}
                                            onChange={(e) => handleRangeInputChange(e.target.value)}
                                            placeholder="Contoh: 1-3, 5, 8-10"
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-surface/90 border border-border/80 text-foreground text-xs sm:text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="text-[11px] text-foreground/50">
                                        Gunakan tanda koma (,) untuk memisahkan hal, dan tanda setrip (-) untuk rentang angka.
                                    </p>
                                </div>
                            </div>

                            {/* Tombol Aksi Cepat Seleksi Halaman */}
                            {splitMode !== "all-separate" && (
                                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={selectAllPages}
                                            className="px-3 py-1.5 rounded-lg bg-surface/80 hover:bg-surface border border-border text-foreground/80 hover:text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                        >
                                            <Check className="w-3.5 h-3.5 text-rose-500" />
                                            <span>Pilih Semua Halaman</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={deselectAllPages}
                                            className="px-3 py-1.5 rounded-lg bg-surface/80 hover:bg-surface border border-border text-foreground/80 hover:text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                        >
                                            <X className="w-3.5 h-3.5 text-foreground/50" />
                                            <span>Hapus Pilihan</span>
                                        </button>
                                    </div>

                                    <div className="text-xs text-foreground/60 flex items-center gap-1.5">
                                        <Eye className="w-3.5 h-3.5 text-rose-400" />
                                        <span>Klik thumbnail untuk pratinjau zoom detail</span>
                                    </div>
                                </div>
                            )}

                            {/* Grid Visual Thumbnail Halaman */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-foreground/90 tracking-wide flex items-center gap-2">
                                        <Grid className="w-4 h-4 text-rose-500" />
                                        <span>Daftar Halaman Dokumen ({pages.length})</span>
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                                    {pages.map((p, idx) => {
                                        const isSelected = splitMode === "all-separate" || selectedPages.has(p.pageNumber);

                                        return (
                                            <div
                                                key={p.pageNumber}
                                                className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col ${
                                                    isSelected
                                                        ? "border-rose-500 bg-rose-500/5 shadow-md shadow-rose-500/10"
                                                        : "border-border/70 bg-surface/40 hover:border-border"
                                                }`}
                                            >
                                                {/* Header Kartu: Checkbox & Nomor Halaman */}
                                                <div className="p-2 sm:px-3 bg-surface/60 border-b border-border/40 flex items-center justify-between gap-1 z-10">
                                                    <span className={`text-[11px] font-bold ${isSelected ? "text-rose-400" : "text-foreground/60"}`}>
                                                        Hal {p.pageNumber}
                                                    </span>

                                                    {splitMode !== "all-separate" && (
                                                        <label className="relative flex items-center justify-center cursor-pointer p-0.5">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => togglePageSelection(p.pageNumber)}
                                                                className="w-4 h-4 rounded border-border/80 text-rose-500 focus:ring-rose-500/30 cursor-pointer accent-rose-500"
                                                            />
                                                        </label>
                                                    )}
                                                </div>

                                                {/* Thumbnail Image Container */}
                                                <div
                                                    onClick={() => openLightbox(idx)}
                                                    className="relative aspect-[1/1.3] w-full p-2 flex items-center justify-center cursor-pointer overflow-hidden bg-neutral-950/40"
                                                    title="Klik untuk melihat pratinjau penuh & zoom"
                                                >
                                                    {p.dataUrl ? (
                                                        <img
                                                            src={p.dataUrl}
                                                            alt={`Halaman ${p.pageNumber}`}
                                                            className="max-h-full max-w-full object-contain rounded-none shadow-sm transition-transform duration-200 group-hover:scale-105 pointer-events-none"
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center text-foreground/40 gap-1">
                                                            <FileText className="w-8 h-8" />
                                                            <span className="text-[10px]">Hal {p.pageNumber}</span>
                                                        </div>
                                                    )}

                                                    {/* Hover Overlay Zoom Icon */}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <div className="p-2 rounded-full bg-rose-500 text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                                            <ZoomIn className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Footer Kartu: Rasio & Dimensi */}
                                                <div className="p-1.5 px-2.5 bg-surface/40 border-t border-border/30 text-[10px] text-foreground/50 flex items-center justify-between">
                                                    <span>{p.aspectRatio}</span>
                                                    <span>{p.width}×{p.height}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Progress Bar Pemrosesan */}
                            {isProcessing && (
                                <div className="p-5 rounded-2xl bg-surface/90 border border-rose-500/30 space-y-2.5 animate-fade-in shadow-xl">
                                    <div className="flex items-center justify-between text-xs font-semibold">
                                        <span className="text-foreground/80 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-rose-500 animate-spin" />
                                            <span>{processStatus}</span>
                                        </span>
                                        <span className="text-rose-400 font-bold">{processPercent}%</span>
                                    </div>
                                    <div className="w-full h-2.5 rounded-full bg-neutral-900 overflow-hidden p-0.5">
                                        <div
                                            className="h-full bg-linear-to-r from-rose-500 to-rose-400 rounded-full transition-all duration-300 shadow-sm"
                                            style={{ width: `${processPercent}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Tombol Eksekusi Pisahkan */}
                            <button
                                type="button"
                                onClick={executeSplit}
                                disabled={isProcessing || (splitMode !== "all-separate" && selectedPages.size === 0)}
                                className={`w-full py-4 rounded-xl font-bold text-white text-sm sm:text-base transition-all shadow-xl flex items-center justify-center gap-2.5 cursor-pointer ${
                                    isProcessing || (splitMode !== "all-separate" && selectedPages.size === 0)
                                        ? "bg-rose-500/40 cursor-not-allowed shadow-none"
                                        : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/25 hover:scale-[1.005]"
                                }`}
                            >
                                <Scissors className="w-5 h-5" />
                                <span>
                                    {isProcessing
                                        ? "Memproses Pemisahan Dokumen..."
                                        : splitMode === "extract-merged"
                                        ? `Ekstrak ${selectedPages.size} Halaman ke 1 File PDF Baru`
                                        : splitMode === "extract-separate"
                                        ? `Pisahkan ${selectedPages.size} Halaman Terpilih (ZIP)`
                                        : `Pisahkan Seluruh ${pages.length} Halaman (ZIP)`}
                                </span>
                            </button>
                        </div>
                    )}

                    {/* Output 1: Hasil Ekstrak Gabungan (Embedded Live PDF Viewer) */}
                    {extractedPdfBlob && (
                        <div className="space-y-4 animate-fade-in">
                            <PdfEmbeddedViewer
                                blob={extractedPdfBlob}
                                fileName={`${pdfFile.name.replace(/\.pdf$/i, "")}_ekstrak.pdf`}
                                title="Dokumen PDF Hasil Ekstraksi Siap Diunduh"
                                accentColor="rose"
                            />
                        </div>
                    )}

                    {/* Output 2: Hasil Pisah Terpisah (ZIP & Galeri Unduh Satuan) */}
                    {extractedZipBlob && individualPdfs.length > 0 && (
                        <div className="p-6 rounded-2xl glass-panel border border-emerald-500/30 space-y-6 shadow-2xl animate-fade-in">
                            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/60">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground">
                                            {individualPdfs.length} Berkas PDF Berhasil Dipisahkan!
                                        </h3>
                                        <p className="text-xs sm:text-sm text-foreground/60">
                                            Anda dapat mengunduh seluruhnya dalam satu arsip ZIP atau mengunduh per halaman secara terpisah.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleDownloadZip}
                                    className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25 cursor-pointer"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Unduh Semua ({ (extractedZipBlob.size / 1024 / 1024).toFixed(2) } MB ZIP)</span>
                                </button>
                            </div>

                            {/* Galeri Berkas Hasil Pisahan dengan Tombol Unduh Satuan */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-foreground/80 tracking-wide uppercase">
                                    Unduh Berkas Satuan
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {individualPdfs.map((item) => (
                                        <div
                                            key={item.pageNumber}
                                            className="p-3 rounded-xl bg-surface/60 border border-border/70 flex items-center justify-between gap-3 hover:border-emerald-500/40 transition-colors"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                                                    Hal {item.pageNumber}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-foreground truncate max-w-35 sm:max-w-40">
                                                        {item.fileName}
                                                    </p>
                                                    <p className="text-[10px] text-foreground/50">
                                                        {(item.blob.size / 1024).toFixed(0)} KB
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleDownloadSinglePagePdf(item)}
                                                className="p-2 rounded-lg bg-surface border border-border/80 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 text-foreground/70 transition-all cursor-pointer"
                                                title={`Unduh ${item.fileName}`}
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Lightbox Reusable */}
            <MediaLightboxModal
                isOpen={lightboxItem !== null}
                onClose={() => setLightboxItem(null)}
                item={lightboxItem}
                onNavigatePrev={() => lightboxIndex !== null && navigateLightbox(lightboxIndex - 1)}
                onNavigateNext={() => lightboxIndex !== null && navigateLightbox(lightboxIndex + 1)}
                hasPrev={lightboxIndex !== null && lightboxIndex > 0}
                hasNext={lightboxIndex !== null && lightboxIndex < pages.length - 1}
                accentColor="rose"
            />
        </div>
    );
}
