"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Dropzone from "@/components/ui/Dropzone";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";
import {
    Hash,
    Download,
    FileText,
    Sparkles,
    CheckCircle2,
    Loader2,
    RotateCcw,
    Eye,
    AlertCircle,
    X,
    ZoomIn,
    PenLine,
    ChevronLeft,
    ChevronRight,
    Type,
    Layers,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Sliders,
    BookOpen,
    Check
} from "lucide-react";
import MediaLightboxModal, { LightboxItem } from "@/components/shared/MediaLightboxModal";
import PdfEmbeddedViewer from "@/components/shared/PdfEmbeddedViewer";
import {
    NumberFormat,
    NumberPosition,
    NumberFont,
    NumberOptions,
    applyPageNumbers,
    formatPageText
} from "@/lib/pdfNumberer";

// Configure PDF.js worker using local public worker
if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

interface FormatOption {
    id: NumberFormat;
    label: string;
    preview: string;
    desc: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
    { id: "number", label: "Angka Sederhana", preview: "1", desc: "Hanya angka biasa (1, 2, 3...)" },
    { id: "page_of_total", label: "Halaman X dari Y", preview: "Halaman 1 dari 12", desc: "Format standar laporan & skripsi" },
    { id: "page_slash_total", label: "Garis Miring (X / Y)", preview: "1 / 12", desc: "Format ringkas untuk dokumen resmi" },
    { id: "hal_number", label: "Singkatan Hal.", preview: "Hal. 1", desc: "Format publikasi Indonesia" },
    { id: "dash_number", label: "Tanda Hubung (- X -)", preview: "- 1 -", desc: "Format elegan majalah & buku" },
    { id: "roman_lower", label: "Romawi Kecil", preview: "i, ii, iii", desc: "Kata pengantar & daftar isi" },
    { id: "roman_upper", label: "Romawi Besar", preview: "I, II, III", desc: "Bab atau lampiran dokumen" },
    { id: "custom", label: "Format Kustom", preview: "Format Bebas", desc: "Gunakan tag {n} dan {total}" },
];

const COLOR_PRESETS = [
    { label: "Hitam Dokumen", hex: "#111827" },
    { label: "Abu Gelap", hex: "#4b5563" },
    { label: "Biru Resmi", hex: "#1e40af" },
    { label: "Merah Kantor", hex: "#b91c1c" },
    { label: "Hijau Nota", hex: "#047857" },
];

export default function ClientNumberPdf() {
    const [file, setFile] = useState<File | null>(null);
    const [fileBytes, setFileBytes] = useState<ArrayBuffer | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [pageCount, setPageCount] = useState<number>(0);
    const [currentPreviewPage, setCurrentPreviewPage] = useState<number>(1);
    const [previewDataUrl, setPreviewDataUrl] = useState<string>("");
    const [previewDimensions, setPreviewDimensions] = useState<{ width: number; height: number }>({ width: 400, height: 560 });

    // Numbering Options State
    const [format, setFormat] = useState<NumberFormat>("number");
    const [customTemplate, setCustomTemplate] = useState<string>("Halaman {n} dari {total}");
    const [position, setPosition] = useState<NumberPosition>("bottom_center");
    const [startPage, setStartPage] = useState<number>(1);
    const [endPage, setEndPage] = useState<number | undefined>(undefined);
    const [startNumber, setStartNumber] = useState<number>(1);
    const [fontSize, setFontSize] = useState<number>(11);
    const [fontFamily, setFontFamily] = useState<NumberFont>("helvetica");
    const [color, setColor] = useState<string>("#111827");
    const [margin, setMargin] = useState<number>(30);

    // Processing & Output States
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [savedPdfBlob, setSavedPdfBlob] = useState<Blob | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [customFileName, setCustomFileName] = useState<string>("dokumen-bernomor");

    // Lightbox modal state
    const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null);

    // Cache of rendered PDF.js pages for quick page swapping
    const pdfDocRef = useRef<any>(null);

    const getFinalFileName = () => {
        const clean = customFileName.trim().replace(/[/\\?%*:|"<>]/g, "");
        const baseName = clean || "dokumen-bernomor";
        return baseName.endsWith(".pdf") ? baseName : `${baseName}.pdf`;
    };

    // Calculate how many pages will actually be numbered
    const numberedRangeInfo = useMemo(() => {
        if (pageCount === 0) return { totalNumbered: 0, start: 1, end: 1 };
        const effectiveStart = Math.max(1, Math.min(startPage, pageCount));
        const effectiveEnd = endPage ? Math.min(pageCount, Math.max(effectiveStart, endPage)) : pageCount;
        const totalNumbered = Math.max(1, effectiveEnd - effectiveStart + 1);
        return { totalNumbered, start: effectiveStart, end: effectiveEnd };
    }, [pageCount, startPage, endPage]);

    // Check if current preview page is within numbered range
    const isCurrentPageNumbered = useMemo(() => {
        return (
            currentPreviewPage >= numberedRangeInfo.start &&
            currentPreviewPage <= numberedRangeInfo.end
        );
    }, [currentPreviewPage, numberedRangeInfo]);

    // Current page number display text for the live preview
    const liveNumberText = useMemo(() => {
        if (!isCurrentPageNumbered) return "";
        const options: NumberOptions = {
            format,
            customTemplate,
            position,
            startPage: numberedRangeInfo.start,
            endPage: numberedRangeInfo.end,
            startNumber,
            fontSize,
            fontFamily,
            color,
            margin,
        };
        return formatPageText(
            currentPreviewPage - 1,
            pageCount,
            options,
            numberedRangeInfo.totalNumbered
        );
    }, [
        isCurrentPageNumbered,
        currentPreviewPage,
        pageCount,
        format,
        customTemplate,
        position,
        numberedRangeInfo,
        startNumber,
        fontSize,
        fontFamily,
        color,
        margin,
    ]);

    // Render a specific page from loaded PDF
    const renderPdfPage = useCallback(async (pdf: any, pageNum: number) => {
        try {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 0.9 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            if (context) {
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                setPreviewDimensions({ width: viewport.width, height: viewport.height });

                await page.render({ canvasContext: context, viewport, canvas }).promise;
                setPreviewDataUrl(canvas.toDataURL("image/jpeg", 0.9));
            }
        } catch (err) {
            console.error("Gagal merender halaman PDF:", err);
        }
    }, []);

    // Handle File Acceptance
    const handleFileAccepted = async (acceptedFiles: File[]) => {
        const pdfFile = acceptedFiles.find(
            (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
        );
        if (!pdfFile) {
            setErrorMessage("Silakan pilih berkas dokumen berformat PDF yang valid.");
            return;
        }

        setFile(pdfFile);
        const originalName = pdfFile.name.replace(/\.pdf$/i, "");
        const clean = originalName.replace(/[/\\?%*:|"<>]/g, "").trim();
        setCustomFileName(clean ? `${clean}-bernomor` : "dokumen-bernomor");

        setIsLoading(true);
        setErrorMessage(null);
        setPreviewDataUrl("");
        setSavedPdfBlob(null);

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            setFileBytes(arrayBuffer);

            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) });
            const pdf = await loadingTask.promise;
            pdfDocRef.current = pdf;
            setPageCount(pdf.numPages);
            setCurrentPreviewPage(1);
            setStartPage(1);
            setEndPage(pdf.numPages);

            await renderPdfPage(pdf, 1);
        } catch (error) {
            console.error("Error reading PDF:", error);
            setErrorMessage(
                "Gagal membaca berkas PDF. Dokumen mungkin terenkripsi atau rusak. Pastikan berkas dapat dibuka secara normal."
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Page navigation handler in preview
    const handlePageChange = async (newPage: number) => {
        if (!pdfDocRef.current || newPage < 1 || newPage > pageCount) return;
        setCurrentPreviewPage(newPage);
        await renderPdfPage(pdfDocRef.current, newPage);
    };

    // Apply Bates Numbering
    const handleApplyNumbering = async () => {
        if (!fileBytes) return;

        setIsProcessing(true);
        setErrorMessage(null);

        try {
            const options: NumberOptions = {
                format,
                customTemplate,
                position,
                startPage: numberedRangeInfo.start,
                endPage: numberedRangeInfo.end,
                startNumber,
                fontSize,
                fontFamily,
                color,
                margin,
            };

            const result = await applyPageNumbers(fileBytes, options);
            setSavedPdfBlob(result.blob);
        } catch (err: any) {
            console.error("Gagal menomori PDF:", err);
            setErrorMessage(
                err?.message || "Terjadi kesalahan saat memproses penomoran halaman PDF."
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setFileBytes(null);
        setPageCount(0);
        setCurrentPreviewPage(1);
        setPreviewDataUrl("");
        setSavedPdfBlob(null);
        setErrorMessage(null);
        pdfDocRef.current = null;
    };

    const openLightbox = () => {
        if (!previewDataUrl) return;
        setLightboxItem({
            url: previewDataUrl,
            title: `${file?.name || "Dokumen PDF"} - Halaman ${currentPreviewPage} dari ${pageCount}`,
            pageNumber: currentPreviewPage,
            totalPages: pageCount,
            width: previewDimensions.width,
            height: previewDimensions.height,
        });
    };

    // Convert PDF font to CSS font-family for live preview
    const getCssFontFamily = (f: NumberFont) => {
        switch (f) {
            case "times":
                return "'Times New Roman', Times, serif";
            case "courier":
                return "'Courier New', Courier, monospace";
            case "helvetica":
            default:
                return "Inter, -apple-system, BlinkMacSystemFont, sans-serif";
        }
    };

    // Calculate CSS positioning coordinates inside the preview container
    const getPreviewPositionStyle = () => {
        // margin percentage approximate calculation for visual placement
        const m = Math.max(8, Math.min(margin * 0.45, 36));
        switch (position) {
            case "top_left":
                return { top: `${m}px`, left: `${m}px`, textAlign: "left" as const };
            case "top_center":
                return { top: `${m}px`, left: "50%", transform: "translateX(-50%)", textAlign: "center" as const };
            case "top_right":
                return { top: `${m}px`, right: `${m}px`, textAlign: "right" as const };
            case "bottom_left":
                return { bottom: `${m}px`, left: `${m}px`, textAlign: "left" as const };
            case "bottom_center":
                return { bottom: `${m}px`, left: "50%", transform: "translateX(-50%)", textAlign: "center" as const };
            case "bottom_right":
                return { bottom: `${m}px`, right: `${m}px`, textAlign: "right" as const };
            default:
                return { bottom: `${m}px`, left: "50%", transform: "translateX(-50%)", textAlign: "center" as const };
        }
    };

    return (
        <div className="space-y-6">
            {/* Error Banner */}
            {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 animate-fade-in text-rose-400">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs sm:text-sm">
                        <p className="font-bold">Gagal Memproses Dokumen</p>
                        <p className="text-foreground/70">{errorMessage}</p>
                    </div>
                    <button
                        onClick={() => setErrorMessage(null)}
                        className="ml-auto text-foreground/50 hover:text-foreground p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Step 1: Upload Dropzone if no file selected */}
            {!file && (
                <div className="space-y-4">
                    <Dropzone
                        onFilesAccepted={handleFileAccepted}
                        accept=".pdf,application/pdf"
                        title="Tarik & Letakkan Berkas PDF di Sini"
                        description="Pilih dokumen PDF apa saja untuk diberi penomoran halaman otomatis secara rapi & profesional."
                        color="indigo"
                        icons={<Hash className="w-8 h-8 text-indigo-400" />}
                    />

                    {/* Quick Features Highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div className="p-4 rounded-2xl bg-surface/60 border border-border/70 flex items-start gap-3">
                            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 shrink-0">
                                <BookOpen className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5 text-xs">
                                <p className="font-bold text-foreground">Lewati Sampul / Cover</p>
                                <p className="text-foreground/60 leading-relaxed">
                                    Mulai penomoran dari halaman 2 atau 3 untuk skripsi & laporan resmi.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-surface/60 border border-border/70 flex items-start gap-3">
                            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 shrink-0">
                                <Layers className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5 text-xs">
                                <p className="font-bold text-foreground">6 Titik Posisi Presisi</p>
                                <p className="text-foreground/60 leading-relaxed">
                                    Bawah tengah, kanan bawah, atas kanan, atau margin khusus.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-surface/60 border border-border/70 flex items-start gap-3">
                            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5 text-xs">
                                <p className="font-bold text-foreground">Angka Romawi & Kustom</p>
                                <p className="text-foreground/60 leading-relaxed">
                                    Dukung i, ii, iii untuk kata pengantar dan angka latin untuk isi.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading Indicator while parsing PDF */}
            {isLoading && (
                <div className="glass-panel p-10 rounded-3xl border border-border/80 text-center space-y-4 shadow-xl">
                    <Loader2 className="w-9 h-9 animate-spin text-indigo-500 mx-auto" />
                    <h3 className="text-base font-bold text-foreground">Membaca Struktur Halaman PDF...</h3>
                    <p className="text-xs text-foreground/60">
                        Memuat pratinjau halaman dan menyiapkan mesin penomoran Bates lokal...
                    </p>
                </div>
            )}

            {/* Step 2: Main Workspace after file uploaded */}
            {file && !isLoading && (
                <div className="space-y-6">
                    {/* Top Bar: File Info & Reset Action */}
                    <div className="p-4 rounded-2xl bg-surface/80 border border-border/80 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-sm font-bold text-foreground truncate max-w-xs sm:max-w-md">
                                    {file.name}
                                </h3>
                                <p className="text-xs text-foreground/50">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Total{" "}
                                    <span className="font-semibold text-foreground/80">{pageCount} Halaman</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-3.5 py-1.5 rounded-xl border border-border/80 hover:bg-surface/90 text-foreground/70 hover:text-foreground text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Ganti Berkas</span>
                            </button>
                        </div>
                    </div>

                    {/* Grid: Left Column (Controls & Settings) vs Right Column (Real-time Preview) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Left Column: Numbering Options */}
                        <div className="lg:col-span-7 space-y-5">
                            <div className="glass-panel p-5 rounded-3xl border border-border/80 shadow-xl space-y-6">
                                {/* Section 1: Position Grid (6 Points) */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                                            <span>Posisi Nomor Halaman (6 Titik)</span>
                                        </label>
                                        <span className="text-[11px] font-semibold text-indigo-400 capitalize">
                                            {position.replace("_", " ")}
                                        </span>
                                    </div>

                                    {/* Visual Paper Sheet Representation with 6 Hotspots */}
                                    <div className="p-4 rounded-2xl bg-surface/60 border border-border/70 flex flex-col items-center">
                                        <div className="w-full max-w-xs h-36 rounded-xl bg-background border-2 border-dashed border-border/80 p-2.5 flex flex-col justify-between shadow-inner relative">
                                            {/* Top Row: Left, Center, Right */}
                                            <div className="flex justify-between items-center w-full">
                                                <button
                                                    type="button"
                                                    onClick={() => setPosition("top_left")}
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                                        position === "top_left"
                                                            ? "bg-indigo-500 text-white border-indigo-400 shadow-md shadow-indigo-500/30 scale-105"
                                                            : "bg-surface hover:bg-surface/80 border-border/60 text-foreground/60"
                                                    }`}
                                                >
                                                    Kiri Atas
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPosition("top_center")}
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                                        position === "top_center"
                                                            ? "bg-indigo-500 text-white border-indigo-400 shadow-md shadow-indigo-500/30 scale-105"
                                                            : "bg-surface hover:bg-surface/80 border-border/60 text-foreground/60"
                                                    }`}
                                                >
                                                    Tengah Atas
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPosition("top_right")}
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                                        position === "top_right"
                                                            ? "bg-indigo-500 text-white border-indigo-400 shadow-md shadow-indigo-500/30 scale-105"
                                                            : "bg-surface hover:bg-surface/80 border-border/60 text-foreground/60"
                                                    }`}
                                                >
                                                    Kanan Atas
                                                </button>
                                            </div>

                                            {/* Center indicator representing document body */}
                                            <div className="text-center text-[10px] text-foreground/30 font-medium select-none">
                                                Isi Dokumen
                                            </div>

                                            {/* Bottom Row: Left, Center, Right */}
                                            <div className="flex justify-between items-center w-full">
                                                <button
                                                    type="button"
                                                    onClick={() => setPosition("bottom_left")}
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                                        position === "bottom_left"
                                                            ? "bg-indigo-500 text-white border-indigo-400 shadow-md shadow-indigo-500/30 scale-105"
                                                            : "bg-surface hover:bg-surface/80 border-border/60 text-foreground/60"
                                                    }`}
                                                >
                                                    Kiri Bawah
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPosition("bottom_center")}
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                                        position === "bottom_center"
                                                            ? "bg-indigo-500 text-white border-indigo-400 shadow-md shadow-indigo-500/30 scale-105"
                                                            : "bg-surface hover:bg-surface/80 border-border/60 text-foreground/60"
                                                    }`}
                                                >
                                                    Bawah Tengah (Populer)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPosition("bottom_right")}
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                                        position === "bottom_right"
                                                            ? "bg-indigo-500 text-white border-indigo-400 shadow-md shadow-indigo-500/30 scale-105"
                                                            : "bg-surface hover:bg-surface/80 border-border/60 text-foreground/60"
                                                    }`}
                                                >
                                                    Kanan Bawah
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Number Format Selection */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                                        <span>Gaya & Format Penomoran</span>
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {FORMAT_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setFormat(opt.id)}
                                                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                                    format === opt.id
                                                        ? "bg-indigo-500/15 border-indigo-500 text-indigo-400 shadow-sm"
                                                        : "bg-surface/50 hover:bg-surface border-border/70 text-foreground"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-foreground">
                                                        {opt.label}
                                                    </span>
                                                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-surface border border-border/80 text-foreground/80">
                                                        {opt.preview}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-foreground/50 leading-tight">
                                                    {opt.desc}
                                                </p>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Custom Template Input if format === 'custom' */}
                                    {format === "custom" && (
                                        <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-2 animate-fade-in">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-indigo-400">
                                                    Pola Format Teks Kustom:
                                                </label>
                                                <span className="text-[10px] text-foreground/50">
                                                    Gunakan: <code className="text-indigo-400">{"{n}"}</code> &{" "}
                                                    <code className="text-indigo-400">{"{total}"}</code>
                                                </span>
                                            </div>
                                            <input
                                                type="text"
                                                value={customTemplate}
                                                onChange={(e) => setCustomTemplate(e.target.value)}
                                                placeholder="Contoh: Dokumen Hal. {n} dari {total}"
                                                className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border/80 text-foreground font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Section 3: Page Range & Cover Exclusion */}
                                <div className="space-y-3 pt-1">
                                    <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span>Rentang Halaman & Pengecualian Sampul</span>
                                    </label>

                                    {/* Quick Shortcut Buttons for Academic & Office Papers */}
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStartPage(1);
                                                setStartNumber(1);
                                            }}
                                            className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                                                startPage === 1
                                                    ? "bg-indigo-500/15 border-indigo-500 text-indigo-400 font-bold"
                                                    : "bg-surface hover:bg-surface/80 border-border/70 text-foreground/70"
                                            }`}
                                        >
                                            Mulai dari Halaman 1 (Semua)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStartPage(2);
                                                setStartNumber(1);
                                            }}
                                            className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                                                startPage === 2
                                                    ? "bg-indigo-500/15 border-indigo-500 text-indigo-400 font-bold"
                                                    : "bg-surface hover:bg-surface/80 border-border/70 text-foreground/70"
                                            }`}
                                        >
                                            Lewati 1 Sampul (Mulai Hal. 2)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStartPage(3);
                                                setStartNumber(1);
                                            }}
                                            className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                                                startPage === 3
                                                    ? "bg-indigo-500/15 border-indigo-500 text-indigo-400 font-bold"
                                                    : "bg-surface hover:bg-surface/80 border-border/70 text-foreground/70"
                                            }`}
                                        >
                                            Lewati Sampul + Judul (Mulai Hal. 3)
                                        </button>
                                    </div>

                                    {/* Granular Numeric Inputs */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="space-y-1.5">
                                            <span className="text-[11px] font-semibold text-foreground/70">
                                                Mulai Pada Halaman:
                                            </span>
                                            <input
                                                type="number"
                                                min={1}
                                                max={pageCount}
                                                value={startPage}
                                                onChange={(e) =>
                                                    setStartPage(Math.max(1, parseInt(e.target.value) || 1))
                                                }
                                                className="w-full px-3 py-2 rounded-xl bg-surface border border-border/80 text-foreground font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <span className="text-[11px] font-semibold text-foreground/70">
                                                Sampai Halaman:
                                            </span>
                                            <input
                                                type="number"
                                                min={startPage}
                                                max={pageCount}
                                                value={endPage || pageCount}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    setEndPage(isNaN(val) ? undefined : Math.min(pageCount, Math.max(startPage, val)));
                                                }}
                                                className="w-full px-3 py-2 rounded-xl bg-surface border border-border/80 text-foreground font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <span className="text-[11px] font-semibold text-foreground/70">
                                                Nomor Urut Awal:
                                            </span>
                                            <input
                                                type="number"
                                                min={1}
                                                value={startNumber}
                                                onChange={(e) =>
                                                    setStartNumber(Math.max(1, parseInt(e.target.value) || 1))
                                                }
                                                className="w-full px-3 py-2 rounded-xl bg-surface border border-border/80 text-foreground font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            />
                                        </div>
                                    </div>

                                    {/* Active Range Summary Info */}
                                    <div className="p-2.5 rounded-xl bg-surface/50 border border-border/60 flex items-center justify-between text-[11px] text-foreground/70">
                                        <span>
                                            Penomoran diterapkan pada:{" "}
                                            <strong className="text-foreground">
                                                Halaman {numberedRangeInfo.start} s.d. {numberedRangeInfo.end}
                                            </strong>
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                                            {numberedRangeInfo.totalNumbered} Halaman Diberi Nomor
                                        </span>
                                    </div>
                                </div>

                                {/* Section 4: Typography & Styling */}
                                <div className="space-y-3 pt-1">
                                    <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-cyan-500" />
                                        <span>Gaya Huruf, Ukuran & Jarak Margin</span>
                                    </label>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Font Family Selector */}
                                        <div className="space-y-1.5">
                                            <span className="text-[11px] font-semibold text-foreground/70">
                                                Jenis Huruf (Font):
                                            </span>
                                            <div className="grid grid-cols-3 gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setFontFamily("helvetica")}
                                                    className={`py-2 px-1 text-center text-[11px] rounded-xl border transition-all cursor-pointer font-sans ${
                                                        fontFamily === "helvetica"
                                                            ? "bg-indigo-500/15 border-indigo-500 text-indigo-400 font-bold"
                                                            : "bg-surface border-border/70 text-foreground/70 hover:bg-surface/80"
                                                    }`}
                                                >
                                                    Helvetica
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFontFamily("times")}
                                                    className={`py-2 px-1 text-center text-[11px] rounded-xl border transition-all cursor-pointer font-serif ${
                                                        fontFamily === "times"
                                                            ? "bg-indigo-500/15 border-indigo-500 text-indigo-400 font-bold"
                                                            : "bg-surface border-border/70 text-foreground/70 hover:bg-surface/80"
                                                    }`}
                                                >
                                                    Times
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFontFamily("courier")}
                                                    className={`py-2 px-1 text-center text-[11px] rounded-xl border transition-all cursor-pointer font-mono ${
                                                        fontFamily === "courier"
                                                            ? "bg-indigo-500/15 border-indigo-500 text-indigo-400 font-bold"
                                                            : "bg-surface border-border/70 text-foreground/70 hover:bg-surface/80"
                                                    }`}
                                                >
                                                    Courier
                                                </button>
                                            </div>
                                        </div>

                                        {/* Color Palette */}
                                        <div className="space-y-1.5">
                                            <span className="text-[11px] font-semibold text-foreground/70">
                                                Warna Tinta Nomor:
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {COLOR_PRESETS.map((c) => (
                                                    <button
                                                        key={c.hex}
                                                        type="button"
                                                        onClick={() => setColor(c.hex)}
                                                        className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                                                            color.toLowerCase() === c.hex.toLowerCase()
                                                                ? "ring-2 ring-indigo-500 scale-105 border-transparent shadow-sm"
                                                                : "border-border/80 hover:scale-105"
                                                        }`}
                                                        style={{ backgroundColor: c.hex }}
                                                        title={c.label}
                                                    >
                                                        {color.toLowerCase() === c.hex.toLowerCase() && (
                                                            <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                                                        )}
                                                    </button>
                                                ))}
                                                {/* Custom Hex input */}
                                                <input
                                                    type="color"
                                                    value={color}
                                                    onChange={(e) => setColor(e.target.value)}
                                                    className="w-8 h-8 rounded-xl border border-border/80 cursor-pointer bg-transparent"
                                                    title="Pilih warna kustom"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sliders: Font Size & Margin */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs">
                                                <span className="font-semibold text-foreground/70">Ukuran Huruf:</span>
                                                <span className="font-bold text-indigo-400">{fontSize} pt</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={8}
                                                max={24}
                                                step={1}
                                                value={fontSize}
                                                onChange={(e) => setFontSize(parseInt(e.target.value))}
                                                className="w-full accent-indigo-500 cursor-pointer"
                                            />
                                            <div className="flex justify-between text-[10px] text-foreground/40">
                                                <span>8 pt (Kecil)</span>
                                                <span>11 pt (Standar)</span>
                                                <span>24 pt (Besar)</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs">
                                                <span className="font-semibold text-foreground/70">Jarak Margin Tepi:</span>
                                                <span className="font-bold text-indigo-400">{margin} pt</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={10}
                                                max={70}
                                                step={2}
                                                value={margin}
                                                onChange={(e) => setMargin(parseInt(e.target.value))}
                                                className="w-full accent-indigo-500 cursor-pointer"
                                            />
                                            <div className="flex justify-between text-[10px] text-foreground/40">
                                                <span>10 pt (Dekat)</span>
                                                <span>30 pt (Standar)</span>
                                                <span>70 pt (Jauh)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Execute Button */}
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={handleApplyNumbering}
                                        disabled={isProcessing}
                                        className="w-full py-3.5 px-6 rounded-2xl bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Menerapkan Bates Stamping ke {pageCount} Halaman...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Hash className="w-5 h-5" />
                                                <span>
                                                    Beri Nomor Halaman PDF ({numberedRangeInfo.totalNumbered} Halaman)
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Live Real-time Visual Preview */}
                        <div className="lg:col-span-5 space-y-4">
                            <div className="glass-panel p-5 rounded-3xl border border-border/80 shadow-xl space-y-4">
                                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Eye className="w-4 h-4 text-indigo-500" />
                                        <h4 className="font-bold text-sm text-foreground">
                                            Pratinjau Halaman {currentPreviewPage}
                                        </h4>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                                        Real-Time Bates Engine
                                    </span>
                                </div>

                                {/* Page Navigation Selector for Preview */}
                                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-surface/60 border border-border/60">
                                    <button
                                        type="button"
                                        onClick={() => handlePageChange(currentPreviewPage - 1)}
                                        disabled={currentPreviewPage <= 1}
                                        className="p-1.5 rounded-lg border border-border/70 hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                                        title="Halaman Sebelumnya"
                                    >
                                        <ChevronLeft className="w-4 h-4 text-foreground" />
                                    </button>

                                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                                        <span>Halaman</span>
                                        <select
                                            value={currentPreviewPage}
                                            onChange={(e) => handlePageChange(parseInt(e.target.value))}
                                            className="px-2 py-1 rounded-lg bg-surface border border-border/80 text-foreground font-bold cursor-pointer text-xs"
                                        >
                                            {Array.from({ length: pageCount }).map((_, i) => (
                                                <option key={i + 1} value={i + 1}>
                                                    {i + 1} {i + 1 < numberedRangeInfo.start ? "(Sampul/Skip)" : ""}
                                                </option>
                                            ))}
                                        </select>
                                        <span className="text-foreground/50">dari {pageCount}</span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handlePageChange(currentPreviewPage + 1)}
                                        disabled={currentPreviewPage >= pageCount}
                                        className="p-1.5 rounded-lg border border-border/70 hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                                        title="Halaman Selanjutnya"
                                    >
                                        <ChevronRight className="w-4 h-4 text-foreground" />
                                    </button>
                                </div>

                                {/* Preview Canvas Container with Overlay Simulation */}
                                <div
                                    onClick={openLightbox}
                                    className="relative w-full aspect-3/4 max-w-sm mx-auto bg-black/40 rounded-2xl overflow-hidden border border-border/60 shadow-inner flex items-center justify-center select-none cursor-pointer group/thumb"
                                    title="Klik untuk melihat pratinjau zoom detail"
                                >
                                    {previewDataUrl ? (
                                        <img
                                            src={previewDataUrl}
                                            alt={`Pratinjau Halaman ${currentPreviewPage}`}
                                            className="w-full h-full object-contain rounded-none pointer-events-none"
                                        />
                                    ) : (
                                        <div className="text-center p-6 space-y-2">
                                            <FileText className="w-12 h-12 text-foreground/30 mx-auto" />
                                            <p className="text-xs text-foreground/40">Memuat pratinjau halaman...</p>
                                        </div>
                                    )}

                                    {/* Numbering Placement Overlay Simulation */}
                                    {isCurrentPageNumbered ? (
                                        <div
                                            className="absolute pointer-events-none whitespace-nowrap select-none font-semibold transition-all duration-150 px-2 py-0.5 rounded-md"
                                            style={{
                                                ...getPreviewPositionStyle(),
                                                color,
                                                fontSize: `${Math.max(10, fontSize * 0.9)}px`,
                                                fontFamily: getCssFontFamily(fontFamily),
                                                textShadow: "0 1px 3px rgba(255,255,255,0.8), 0 0 1px rgba(0,0,0,0.5)",
                                                background: "rgba(255, 255, 255, 0.45)",
                                                backdropFilter: "blur(2px)",
                                                border: "1px dashed rgba(99, 102, 241, 0.6)",
                                            }}
                                        >
                                            {liveNumberText}
                                        </div>
                                    ) : (
                                        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500/90 text-black text-[10px] font-bold shadow-md pointer-events-none">
                                            Halaman Ini Dilewati (Tidak Diberi Nomor)
                                        </div>
                                    )}

                                    {/* Hover Zoom Icon */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                        <div className="p-2.5 rounded-full bg-indigo-500 text-white shadow-lg transform scale-90 group-hover/thumb:scale-100 transition-transform">
                                            <ZoomIn className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1 text-center">
                                    <p className="text-[11px] text-foreground/50 leading-relaxed">
                                        Kotak garis putus-putus menunjukkan simulasi posisi nomor yang akan dicap permanen pada PDF. Klik gambar untuk zoom.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Output Result: Live Embedded PDF Viewer */}
                    {savedPdfBlob && (
                        <div className="space-y-4 pt-4 animate-fade-in">
                            {/* Bar Ubah Nama File sebelum unduh */}
                            <div className="p-3.5 rounded-2xl bg-surface/80 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left shadow-sm">
                                <div className="flex items-center gap-2">
                                    <PenLine className="w-4 h-4 text-indigo-500 shrink-0" />
                                    <span className="text-xs font-bold text-foreground">Nama Berkas Unduhan:</span>
                                </div>
                                <div className="relative flex items-center flex-1 max-w-sm">
                                    <input
                                        type="text"
                                        value={customFileName}
                                        onChange={(e) => setCustomFileName(e.target.value)}
                                        placeholder="dokumen-bernomor"
                                        className="w-full px-3 py-1.5 pr-12 text-xs sm:text-sm rounded-xl bg-surface border border-border/80 focus:border-indigo-500/80 focus:outline-hidden text-foreground font-semibold"
                                    />
                                    <span className="absolute right-3 text-xs font-bold text-indigo-500 pointer-events-none select-none">
                                        .pdf
                                    </span>
                                </div>
                            </div>

                            <PdfEmbeddedViewer
                                blob={savedPdfBlob}
                                fileName={getFinalFileName()}
                                title="Dokumen PDF Bernomor Siap Diunduh"
                                accentColor="blue"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Modal Lightbox Reusable untuk Memeriksa Detail Dokumen */}
            <MediaLightboxModal
                isOpen={lightboxItem !== null}
                onClose={() => setLightboxItem(null)}
                item={lightboxItem}
                accentColor="indigo"
            />
        </div>
    );
}
