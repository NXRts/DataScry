"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Dropzone from "@/components/ui/Dropzone";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";
import { PDFDocument } from "pdf-lib";
import {
    ShieldAlert,
    Download,
    FileText,
    Sparkles,
    CheckCircle2,
    Loader2,
    Check,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    Trash2,
    Square,
    EyeOff,
    HelpCircle,
    AlertTriangle,
    Eye,
    Maximize2,
    Info,
    Layers,
    X
} from "lucide-react";
import MediaLightboxModal, { LightboxItem } from "@/components/shared/MediaLightboxModal";
import PdfEmbeddedViewer from "@/components/shared/PdfEmbeddedViewer";

// Setup PDF.js worker
if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

export type RedactionStyle = "blackout" | "whiteout" | "badge";

export interface RedactionBox {
    id: string;
    pageIndex: number;
    xPercent: number; // 0..1
    yPercent: number; // 0..1
    wPercent: number; // 0..1
    hPercent: number; // 0..1
    style: RedactionStyle;
}

export default function ClientRedactPdf() {
    const [file, setFile] = useState<File | null>(null);
    const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
    const [pageCount, setPageCount] = useState<number>(0);
    const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
    const [pageCanvasDataUrl, setPageCanvasDataUrl] = useState<string>("");
    const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 595, height: 842 });
    const [isLoadingPage, setIsLoadingPage] = useState<boolean>(false);

    // Zoom & Tools state
    const [zoomScale, setZoomScale] = useState<number>(1.0);
    const [activeStyle, setActiveStyle] = useState<RedactionStyle>("blackout");
    const [redactions, setRedactions] = useState<RedactionBox[]>([]);

    // Interactive Drawing state
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
    const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);

    // Processing & Output state
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [processProgress, setProcessProgress] = useState<number>(0);
    const [processStatusText, setProcessStatusText] = useState<string>("");
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [resultFileName, setResultFileName] = useState<string>("");
    const [resultSize, setResultSize] = useState<number>(0);
    const [resultThumbnailUrl, setResultThumbnailUrl] = useState<string | null>(null);
    const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Refs
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Filter redactions for current page
    const currentPageRedactions = redactions.filter((r) => r.pageIndex === currentPageIndex);
    const totalRedactionCount = redactions.length;
    const pagesWithRedactionsCount = new Set(redactions.map((r) => r.pageIndex)).size;

    // Load PDF Page
    const renderPdfPage = useCallback(async (bytes: Uint8Array, pageIdx: number) => {
        setIsLoadingPage(true);
        setErrorMessage(null);
        try {
            const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
            const pdf = await loadingTask.promise;
            setPageCount(pdf.numPages);

            const targetPageNum = Math.min(Math.max(1, pageIdx + 1), pdf.numPages);
            const page = await pdf.getPage(targetPageNum);

            // Render preview with scale 1.5 for clear preview without lag
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            if (context) {
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                await page.render({ canvasContext: context, viewport, canvas }).promise;
                const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
                setPageCanvasDataUrl(dataUrl);

                const unscaled = page.getViewport({ scale: 1.0 });
                setPageSize({ width: unscaled.width, height: unscaled.height });
            }
        } catch (err: unknown) {
            console.error("Gagal merender halaman PDF:", err);
            setErrorMessage("Gagal memuat halaman dokumen. Berkas mungkin terkunci sandi atau rusak.");
        } finally {
            setIsLoadingPage(false);
        }
    }, []);

    // Handle File Select
    const handleFileSelect = async (selectedFiles: File[]) => {
        if (!selectedFiles || selectedFiles.length === 0) return;
        const selected = selectedFiles[0];

        if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
            setErrorMessage("Harap pilih berkas berekstensi .pdf yang valid.");
            return;
        }

        try {
            setFile(selected);
            setResultBlob(null);
            setErrorMessage(null);
            setRedactions([]);
            setCurrentPageIndex(0);

            const buffer = await selected.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            setFileBytes(bytes);

            await renderPdfPage(bytes, 0);
        } catch (err: unknown) {
            console.error("Gagal membaca file:", err);
            setErrorMessage("Gagal membaca file PDF. Pastikan file tidak rusak.");
        }
    };

    // Change Page
    const goToPage = (newIndex: number) => {
        if (!fileBytes || newIndex < 0 || newIndex >= pageCount || newIndex === currentPageIndex) return;
        setCurrentPageIndex(newIndex);
        renderPdfPage(fileBytes, newIndex);
    };

    // Pointer events for drawing redaction rectangle
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!previewContainerRef.current) return;
        const rect = previewContainerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setIsDrawing(true);
        setDrawStart({ x, y });
        setDrawCurrent({ x, y });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDrawing || !drawStart || !previewContainerRef.current) return;
        const rect = previewContainerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
        setDrawCurrent({ x, y });
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDrawing || !drawStart || !drawCurrent || !previewContainerRef.current) {
            setIsDrawing(false);
            setDrawStart(null);
            setDrawCurrent(null);
            return;
        }

        const rect = previewContainerRef.current.getBoundingClientRect();
        const xMin = Math.min(drawStart.x, drawCurrent.x);
        const yMin = Math.min(drawStart.y, drawCurrent.y);
        const width = Math.abs(drawCurrent.x - drawStart.x);
        const height = Math.abs(drawCurrent.y - drawStart.y);

        // Threshold minimal 8px x 8px agar klik tidak sengaja tidak membuat kotak tak kasat mata
        if (width >= 8 && height >= 8 && rect.width > 0 && rect.height > 0) {
            const newBox: RedactionBox = {
                id: `redact-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                pageIndex: currentPageIndex,
                xPercent: Math.max(0, Math.min(1, xMin / rect.width)),
                yPercent: Math.max(0, Math.min(1, yMin / rect.height)),
                wPercent: Math.max(0, Math.min(1, width / rect.width)),
                hPercent: Math.max(0, Math.min(1, height / rect.height)),
                style: activeStyle
            };

            setRedactions((prev) => [...prev, newBox]);
        }

        setIsDrawing(false);
        setDrawStart(null);
        setDrawCurrent(null);
    };

    // Remove single box
    const removeRedactionBox = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setRedactions((prev) => prev.filter((r) => r.id !== id));
    };

    // Clear boxes on current page
    const clearCurrentPageRedactions = () => {
        setRedactions((prev) => prev.filter((r) => r.pageIndex !== currentPageIndex));
    };

    // Clear all boxes in document
    const clearAllRedactions = () => {
        setRedactions([]);
    };

    // Burn-in Redaction Engine
    const applyPermanentRedaction = async () => {
        if (!file || !fileBytes || redactions.length === 0) return;

        setIsProcessing(true);
        setProcessProgress(5);
        setProcessStatusText("Memulai mesin burn-in redaction...");
        setErrorMessage(null);

        try {
            // Load source document in pdf-lib and pdfjs
            const origPdfDoc = await PDFDocument.load(fileBytes);
            const loadingTask = pdfjsLib.getDocument({ data: fileBytes.slice() });
            const pdfjsDoc = await loadingTask.promise;
            const totalPages = pdfjsDoc.numPages;

            // Target PDF document
            const newPdfDoc = await PDFDocument.create();

            for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
                const pageNum = pageIdx + 1;
                setProcessProgress(Math.round(10 + (pageIdx / totalPages) * 75));
                setProcessStatusText(`Memproses halaman ${pageNum} dari ${totalPages}...`);

                const pageRedactList = redactions.filter((r) => r.pageIndex === pageIdx);

                if (pageRedactList.length > 0) {
                    // TRUE REDACTION: Render to High-DPI Canvas & bake the solid blocks into raster pixels!
                    const page = await pdfjsDoc.getPage(pageNum);
                    // Gunakan skala 2.0x untuk teks resolusi tinggi (150-200 DPI setara cetak tajam)
                    const scale = 2.0;
                    const viewport = page.getViewport({ scale });

                    const offscreenCanvas = document.createElement("canvas");
                    offscreenCanvas.width = viewport.width;
                    offscreenCanvas.height = viewport.height;
                    const ctx = offscreenCanvas.getContext("2d", { willReadFrequently: true });

                    if (!ctx) throw new Error("Gagal menginisialisasi kanvas render");

                    // Render original page contents to raster canvas
                    await page.render({ canvasContext: ctx, viewport, canvas: offscreenCanvas }).promise;

                    // Burn in each redaction box directly into the raster bitmap
                    for (const box of pageRedactList) {
                        const bx = box.xPercent * offscreenCanvas.width;
                        const by = box.yPercent * offscreenCanvas.height;
                        const bw = box.wPercent * offscreenCanvas.width;
                        const bh = box.hPercent * offscreenCanvas.height;

                        if (box.style === "whiteout") {
                            ctx.fillStyle = "#ffffff";
                            ctx.fillRect(bx, by, bw, bh);
                        } else if (box.style === "badge") {
                            ctx.fillStyle = "#09090b";
                            ctx.fillRect(bx, by, bw, bh);

                            // Border subtle
                            ctx.strokeStyle = "#e11d48";
                            ctx.lineWidth = Math.max(2, 2 * scale);
                            ctx.strokeRect(bx, by, bw, bh);

                            // Text badge label
                            ctx.fillStyle = "#ffffff";
                            const fontSize = Math.max(12, Math.min(bw * 0.16, bh * 0.55));
                            ctx.font = `bold ${fontSize}px sans-serif`;
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";
                            ctx.fillText("DISENSOR", bx + bw / 2, by + bh / 2);
                        } else {
                            // Default: Blackout solid pekat
                            ctx.fillStyle = "#000000";
                            ctx.fillRect(bx, by, bw, bh);
                        }
                    }

                    // Convert canvas to compressed high-quality JPEG image
                    const imageBlob = await new Promise<Blob>((resolve, reject) => {
                        offscreenCanvas.toBlob(
                            (b) => (b ? resolve(b) : reject(new Error("Gagal mengonversi kanvas"))),
                            "image/jpeg",
                            0.93
                        );
                    });

                    const imgBytes = await imageBlob.arrayBuffer();
                    const embeddedImage = await newPdfDoc.embedJpg(imgBytes);

                    // Add page with original dimensions
                    const unscaled = page.getViewport({ scale: 1.0 });
                    const newPage = newPdfDoc.addPage([unscaled.width, unscaled.height]);
                    newPage.drawImage(embeddedImage, {
                        x: 0,
                        y: 0,
                        width: unscaled.width,
                        height: unscaled.height
                    });
                } else {
                    // Non-redacted page: Salin halaman asli secara vektor tanpa rasterisasi
                    const [copiedPage] = await newPdfDoc.copyPages(origPdfDoc, [pageIdx]);
                    newPdfDoc.addPage(copiedPage);
                }
            }

            setProcessProgress(90);
            setProcessStatusText("Menyusun berkas PDF final...");

            const finalBytes = await newPdfDoc.save();
            const outBlob = new Blob([finalBytes.buffer as ArrayBuffer], { type: "application/pdf" });

            const baseName = file.name.replace(/\.pdf$/i, "");
            const finalName = `${baseName}-redacted.pdf`;

            setResultBlob(outBlob);
            setResultFileName(finalName);
            setResultSize(outBlob.size);

            // Buat thumbnail halaman pertama untuk pratinjau / lightbox
            try {
                const finalPdfjsDoc = await pdfjsLib.getDocument({ data: finalBytes.slice() }).promise;
                const firstPage = await finalPdfjsDoc.getPage(1);
                const thumbVp = firstPage.getViewport({ scale: 1.0 });
                const thumbCanvas = document.createElement("canvas");
                thumbCanvas.width = thumbVp.width;
                thumbCanvas.height = thumbVp.height;
                const tCtx = thumbCanvas.getContext("2d");
                if (tCtx) {
                    await firstPage.render({ canvasContext: tCtx, viewport: thumbVp, canvas: thumbCanvas }).promise;
                    setResultThumbnailUrl(thumbCanvas.toDataURL("image/jpeg", 0.9));
                }
            } catch (thumbErr) {
                console.warn("Pratinjau thumbnail gagal dibuat:", thumbErr);
            }

            setProcessProgress(100);
            setProcessStatusText("Selesai! Sensor berhasil dibakar permanen.");
        } catch (err: unknown) {
            console.error("Gagal melakukan redaction:", err);
            setErrorMessage("Terjadi kesalahan saat memproses sensor dokumen. Silakan coba lagi.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Download Result
    const downloadRedactedPdf = () => {
        if (!resultBlob) return;
        const url = URL.createObjectURL(resultBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = resultFileName || "dokumen-redacted.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    // Reset All State
    const handleReset = () => {
        setFile(null);
        setFileBytes(null);
        setPageCount(0);
        setCurrentPageIndex(0);
        setPageCanvasDataUrl("");
        setRedactions([]);
        setResultBlob(null);
        setResultThumbnailUrl(null);
        setErrorMessage(null);
        setIsProcessing(false);
    };

    // Calculate temporary drag box for visual feedback
    const getActiveDragBoxStyle = () => {
        if (!isDrawing || !drawStart || !drawCurrent || !previewContainerRef.current) return null;
        const rect = previewContainerRef.current.getBoundingClientRect();
        const x = Math.min(drawStart.x, drawCurrent.x);
        const y = Math.min(drawStart.y, drawCurrent.y);
        const w = Math.abs(drawCurrent.x - drawStart.x);
        const h = Math.abs(drawCurrent.y - drawStart.y);

        return {
            left: `${(x / rect.width) * 100}%`,
            top: `${(y / rect.height) * 100}%`,
            width: `${(w / rect.width) * 100}%`,
            height: `${(h / rect.height) * 100}%`
        };
    };

    const dragStyle = getActiveDragBoxStyle();

    return (
        <div className="space-y-8">
            {/* Error Banner */}
            {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm font-medium">{errorMessage}</div>
                    <button
                        onClick={() => setErrorMessage(null)}
                        className="text-foreground/40 hover:text-foreground text-xs"
                    >
                        Tutup
                    </button>
                </div>
            )}

            {/* Step 1: Upload State */}
            {!file && (
                <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-border/80 space-y-6">
                    <div className="text-center max-w-xl mx-auto space-y-2">
                        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
                            <ShieldAlert className="w-7 h-7" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                            Pilih Dokumen PDF yang Ingin Disensor
                        </h2>
                        <p className="text-foreground/60 text-sm">
                            Tutup NIK e-KTP, No. KK, nomor rekening bank, nominal gaji, alamat, atau tanda tangan secara permanen tanpa jejak teks tersisa.
                        </p>
                    </div>

                    <Dropzone
                        onFilesAccepted={handleFileSelect}
                        accept=".pdf,application/pdf"
                        title="Tarik & Lepas File PDF ke Sini"
                        description="Mendukung dokumen tunggal atau multi-halaman. Berkas diproses 100% lokal."
                    />

                    {/* Security Notice Box */}
                    <div className="bg-surface/60 border border-border/60 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-xs text-foreground/70">
                        <Info className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        <div className="space-y-1 leading-relaxed">
                            <p className="font-semibold text-foreground">
                                Mengapa True Redaction DataScry Lebih Aman?
                            </p>
                            <p>
                                Banyak orang menyensor dokumen hanya dengan menempelkan kotak hitam di editor biasa, di mana teks aslinya masih dapat disalin (Ctrl+C). DataScry membakar (<span className="text-rose-400 font-medium">burn-in</span>) area sensor ke piksel gambar secara permanen sehingga teks sensitif benar-benar terhapus dari berkas.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Interactive Editor State */}
            {file && !resultBlob && (
                <div className="space-y-6">
                    {/* Top Toolbar */}
                    <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-border/80 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground text-sm sm:text-base truncate max-w-50 sm:max-w-xs" title={file.name}>
                                    {file.name}
                                </h3>
                                <p className="text-xs text-foreground/50">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB • {pageCount} Halaman
                                </p>
                            </div>
                        </div>

                        {/* Page Navigation Controls */}
                        <div className="flex items-center gap-2 bg-surface/80 border border-border/60 rounded-xl px-2 py-1">
                            <button
                                onClick={() => goToPage(currentPageIndex - 1)}
                                disabled={currentPageIndex === 0 || isLoadingPage}
                                className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-foreground"
                                title="Halaman Sebelumnya"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-semibold px-2 text-foreground">
                                Hal {currentPageIndex + 1} / {pageCount}
                            </span>
                            <button
                                onClick={() => goToPage(currentPageIndex + 1)}
                                disabled={currentPageIndex >= pageCount - 1 || isLoadingPage}
                                className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-foreground"
                                title="Halaman Selanjutnya"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Zoom & Reset Button */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-surface/80 border border-border/60 rounded-xl px-2 py-1">
                                <button
                                    onClick={() => setZoomScale((prev) => Math.max(0.75, prev - 0.25))}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-foreground transition-colors"
                                    title="Perkecil Tampilan"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-mono font-medium px-1 text-foreground">
                                    {Math.round(zoomScale * 100)}%
                                </span>
                                <button
                                    onClick={() => setZoomScale((prev) => Math.min(1.75, prev + 0.25))}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-foreground transition-colors"
                                    title="Perbesar Tampilan"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                onClick={handleReset}
                                className="px-3 py-2 rounded-xl text-xs font-medium text-foreground/70 hover:text-foreground hover:bg-surface border border-border/60 transition-colors flex items-center gap-1.5"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Ganti File
                            </button>
                        </div>
                    </div>

                    {/* Secondary Tool Controls & Style Picker */}
                    <div className="glass-panel p-4 rounded-2xl border border-border/80 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mr-1">
                                Gaya Sensor:
                            </span>

                            {/* Blackout */}
                            <button
                                onClick={() => setActiveStyle("blackout")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                                    activeStyle === "blackout"
                                        ? "bg-zinc-950 text-white border border-rose-500 shadow-sm"
                                        : "bg-surface/60 text-foreground/70 hover:bg-surface border border-border/60"
                                }`}
                            >
                                <span className="w-3 h-3 rounded-xs bg-black border border-white/20" />
                                Hitam Pekat (Blackout)
                            </button>

                            {/* Whiteout */}
                            <button
                                onClick={() => setActiveStyle("whiteout")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                                    activeStyle === "whiteout"
                                        ? "bg-zinc-800 text-white border border-rose-500 shadow-sm"
                                        : "bg-surface/60 text-foreground/70 hover:bg-surface border border-border/60"
                                }`}
                            >
                                <span className="w-3 h-3 rounded-xs bg-white border border-gray-400" />
                                Putih Bersih (Whiteout)
                            </button>

                            {/* Badge */}
                            <button
                                onClick={() => setActiveStyle("badge")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                                    activeStyle === "badge"
                                        ? "bg-zinc-800 text-white border border-rose-500 shadow-sm"
                                        : "bg-surface/60 text-foreground/70 hover:bg-surface border border-border/60"
                                }`}
                            >
                                <span className="px-1 text-[9px] font-bold rounded-xs bg-black text-rose-400 border border-rose-500/40">
                                    DISENSOR
                                </span>
                                Label Keamanan
                            </button>
                        </div>

                        {/* Redaction Statistics & Clear Actions */}
                        <div className="flex items-center gap-2">
                            {currentPageRedactions.length > 0 && (
                                <button
                                    onClick={clearCurrentPageRedactions}
                                    className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors flex items-center gap-1.5"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Hapus di Hal {currentPageIndex + 1} ({currentPageRedactions.length})
                                </button>
                            )}

                            {totalRedactionCount > 0 && (
                                <button
                                    onClick={clearAllRedactions}
                                    className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-foreground/50 hover:text-foreground hover:bg-surface transition-colors"
                                >
                                    Reset Semua ({totalRedactionCount})
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Main Interactive Canvas Area */}
                    <div className="glass-panel p-4 sm:p-8 rounded-3xl border border-border/80 flex flex-col items-center justify-center min-h-125 overflow-auto bg-black/40">
                        {isLoadingPage ? (
                            <div className="py-24 text-center space-y-3">
                                <Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto" />
                                <p className="text-sm font-medium text-foreground/70">Memuat halaman dokumen...</p>
                            </div>
                        ) : pageCanvasDataUrl ? (
                            <div className="flex flex-col items-center">
                                {/* Instructions Hint */}
                                <div className="mb-3 px-3 py-1.5 rounded-full bg-surface/80 border border-border/60 text-xs text-foreground/70 flex items-center gap-1.5">
                                    <Square className="w-3.5 h-3.5 text-rose-400" />
                                    <span>Klik lalu seret (drag) mouse untuk menggambar kotak sensor pada dokumen</span>
                                </div>

                                {/* Scaled Document Wrapper */}
                                <div
                                    style={{
                                        transform: `scale(${zoomScale})`,
                                        transformOrigin: "top center",
                                        transition: "transform 0.15s ease-out"
                                    }}
                                    className="relative select-none shadow-2xl rounded-lg overflow-hidden border border-border/60 bg-white"
                                >
                                    {/* Document Canvas Preview Image */}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={pageCanvasDataUrl}
                                        alt={`Dokumen Halaman ${currentPageIndex + 1}`}
                                        className="pointer-events-none block max-w-full h-auto"
                                        draggable={false}
                                    />

                                    {/* Interactive Drawing Overlay */}
                                    <div
                                        ref={previewContainerRef}
                                        onPointerDown={handlePointerDown}
                                        onPointerMove={handlePointerMove}
                                        onPointerUp={handlePointerUp}
                                        onPointerCancel={handlePointerUp}
                                        className="absolute inset-0 cursor-crosshair touch-none"
                                    >
                                        {/* Existing Redaction Boxes on This Page */}
                                        {currentPageRedactions.map((box) => (
                                            <div
                                                key={box.id}
                                                style={{
                                                    left: `${box.xPercent * 100}%`,
                                                    top: `${box.yPercent * 100}%`,
                                                    width: `${box.wPercent * 100}%`,
                                                    height: `${box.hPercent * 100}%`
                                                }}
                                                className={`absolute group transition-opacity ${
                                                    box.style === "whiteout"
                                                        ? "bg-white/95 border-2 border-dashed border-gray-400 shadow-sm"
                                                        : box.style === "badge"
                                                        ? "bg-zinc-950 border border-rose-500 text-rose-400 flex items-center justify-center text-center shadow-md"
                                                        : "bg-black/95 border border-rose-500/60 shadow-md"
                                                }`}
                                            >
                                                {box.style === "badge" && (
                                                    <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase px-1 pointer-events-none">
                                                        DISENSOR
                                                    </span>
                                                )}

                                                {/* Delete Button on Hover */}
                                                <button
                                                    onClick={(e) => removeRedactionBox(box.id, e)}
                                                    className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-md z-20 cursor-pointer"
                                                    title="Hapus sensor ini"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Active Dragging Rectangle Preview */}
                                        {dragStyle && (
                                            <div
                                                style={dragStyle}
                                                className={`absolute pointer-events-none border-2 ${
                                                    activeStyle === "whiteout"
                                                        ? "bg-white/70 border-gray-600"
                                                        : activeStyle === "badge"
                                                        ? "bg-zinc-900/80 border-rose-500"
                                                        : "bg-black/80 border-rose-500"
                                                }`}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Bottom Action Section */}
                    <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="space-y-1 text-center sm:text-left">
                            <div className="flex items-center gap-2 justify-center sm:justify-start">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                    {totalRedactionCount} Area Sensor Aktif
                                </span>
                                <span className="text-xs text-foreground/50">
                                    di {pagesWithRedactionsCount} dari {pageCount} halaman
                                </span>
                            </div>
                            <p className="text-xs text-foreground/60">
                                Halaman dengan sensor akan dibakar secara raster sehingga teks di baliknya musnah permanen.
                            </p>
                        </div>

                        <button
                            onClick={applyPermanentRedaction}
                            disabled={totalRedactionCount === 0 || isProcessing}
                            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-sm bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Membakar Sensor ({processProgress}%)...</span>
                                </>
                            ) : (
                                <>
                                    <ShieldAlert className="w-4 h-4" />
                                    <span>Terapkan Sensor & Unduh PDF</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Progress overlay modal when burning */}
                    {isProcessing && (
                        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                            <div className="glass-panel p-8 rounded-3xl border border-border/80 max-w-md w-full text-center space-y-4 shadow-2xl">
                                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-foreground">
                                        Membakar Sensor Secara Permanen
                                    </h3>
                                    <p className="text-xs text-foreground/60">{processStatusText}</p>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-surface rounded-full h-2.5 overflow-hidden border border-border/60">
                                    <div
                                        className="bg-rose-500 h-full rounded-full transition-all duration-300"
                                        style={{ width: `${processProgress}%` }}
                                    />
                                </div>
                                <span className="text-xs font-mono text-foreground/50">{processProgress}%</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Success & Download State */}
            {resultBlob && (
                <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-border/80 space-y-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-border/60">
                            <div className="flex items-center gap-4 text-center sm:text-left">
                                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0 mx-auto sm:mx-0">
                                    <CheckCircle2 className="w-7 h-7" />
                                </div>
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold mb-1">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        True Redaction Selesai!
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground truncate max-w-sm sm:max-w-md">
                                        {resultFileName}
                                    </h3>
                                    <p className="text-xs text-foreground/60 mt-0.5">
                                        Ukuran Berkas: {(resultSize / 1024 / 1024).toFixed(2)} MB • {totalRedactionCount} Area Sensor Terbakar
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                    onClick={downloadRedactedPdf}
                                    className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl font-bold text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Unduh Dokumen PDF Aman</span>
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="p-3 rounded-2xl bg-surface hover:bg-surface/80 border border-border/60 text-foreground/70 hover:text-foreground transition-colors"
                                    title="Sensor Dokumen Lain"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Interactive Embedded PDF Viewer */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-rose-400" />
                                    Pratinjau Hasil Akhir Dokumen
                                </h4>
                                {resultThumbnailUrl && (
                                    <button
                                        onClick={() =>
                                            setLightboxItem({
                                                url: resultThumbnailUrl,
                                                title: `Pratinjau Sensor: ${resultFileName}`,
                                                mimeType: "image/jpeg"
                                            })
                                        }
                                        className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                        <ZoomIn className="w-3.5 h-3.5" />
                                        Inspeksi Zoom 400%
                                    </button>
                                )}
                            </div>

                            <PdfEmbeddedViewer
                                blob={resultBlob}
                                fileName={resultFileName}
                                fileSize={resultSize}
                                accentColor="rose"
                                onDownload={downloadRedactedPdf}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Media Lightbox Modal for HD Inspection */}
            <MediaLightboxModal
                isOpen={!!lightboxItem}
                item={lightboxItem}
                onClose={() => setLightboxItem(null)}
                accentColor="rose"
            />
        </div>
    );
}
