"use client";

import { useState, useEffect, useRef } from "react";
import Dropzone from "@/components/ui/Dropzone";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { 
    FileText, 
    RotateCcw, 
    CheckCircle2, 
    ZoomIn, 
    CheckSquare, 
    Square, 
    ArrowRight, 
    FolderOpen, 
    Download, 
    AlertCircle, 
    X,
    Eye,
    Loader2
} from "lucide-react";
import MediaLightboxModal, { LightboxItem } from "@/components/shared/MediaLightboxModal";

interface PageThumbnail {
    pageNumber: number;
    dataUrl: string;
    width: number;
    height: number;
    aspectRatio: string;
}

export default function ClientPdfToWord() {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pages, setPages] = useState<PageThumbnail[]>([]);
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
    const [pageRange, setPageRange] = useState<string>("");
    
    // Status
    const [isLoadingPages, setIsLoadingPages] = useState<boolean>(false);
    const [loadingProgress, setLoadingProgress] = useState<string>("");
    const [isConverting, setIsConverting] = useState<boolean>(false);
    const [convertProgress, setConvertProgress] = useState<number>(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Result
    const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
    const [convertedPageCount, setConvertedPageCount] = useState<number>(0);

    // Lightbox
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (typeof window !== "undefined" && pdfjsLib?.GlobalWorkerOptions) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        }
    }, []);

    const formatAspectRatio = (width: number, height: number): string => {
        const ratio = width / height;
        if (Math.abs(ratio - 16 / 9) < 0.08) return "16:9 Landscape";
        if (Math.abs(ratio - 9 / 16) < 0.08) return "9:16 Portrait";
        if (Math.abs(ratio - 1 / 1.414) < 0.08) return "A4 Portrait";
        if (Math.abs(ratio - 1.414 / 1) < 0.08) return "A4 Landscape";
        if (Math.abs(ratio - 4 / 3) < 0.08) return "4:3 Standard";
        return ratio >= 1 ? "Landscape" : "Portrait";
    };

    // Parse page range input (e.g., "1-3, 5")
    const parsePageRange = (rangeStr: string, totalPages: number): Set<number> => {
        const result = new Set<number>();
        if (!rangeStr.trim()) return result;

        const parts = rangeStr.split(",");
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes("-")) {
                const [startStr, endStr] = trimmed.split("-").map(s => s.trim());
                const start = parseInt(startStr, 10);
                const end = parseInt(endStr, 10);
                if (!isNaN(start) && !isNaN(end) && start <= end) {
                    for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
                        result.add(i);
                    }
                }
            } else {
                const p = parseInt(trimmed, 10);
                if (!isNaN(p) && p >= 1 && p <= totalPages) {
                    result.add(p);
                }
            }
        }
        return result;
    };

    const formatSelectedPagesToRange = (selected: Set<number>, total: number): string => {
        if (selected.size === total && total > 0) return `1-${total}`;
        if (selected.size === 0) return "";

        const sorted = Array.from(selected).sort((a, b) => a - b);
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
        return ranges.join(", ");
    };

    const handleFiles = async (newFiles: File[]) => {
        const pdfFiles = newFiles.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
        if (pdfFiles.length === 0) {
            setErrorMessage("Silakan pilih dokumen berformat PDF yang valid.");
            return;
        }

        const targetFile = pdfFiles[0];
        setPdfFile(targetFile);
        setIsLoadingPages(true);
        setErrorMessage(null);
        setPages([]);
        setSelectedPages(new Set());
        setPageRange("");
        setDocxBlob(null);
        setLoadingProgress("Membuka dokumen PDF...");

        try {
            const arrayBuffer = await targetFile.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
            const pdf = await loadingTask.promise;
            const totalPages = pdf.numPages;

            const loadedThumbs: PageThumbnail[] = [];
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
            setPageRange(totalPages > 1 ? `1-${totalPages}` : "1");
        } catch (err: any) {
            console.error("Gagal membaca PDF:", err);
            setErrorMessage("Gagal membaca dokumen PDF. Berkas mungkin rusak atau dilindungi kata sandi.");
        } finally {
            setIsLoadingPages(false);
            setLoadingProgress("");
        }
    };

    const handleTogglePage = (pageNum: number) => {
        setSelectedPages(prev => {
            const next = new Set(prev);
            if (next.has(pageNum)) {
                next.delete(pageNum);
            } else {
                next.add(pageNum);
            }
            setPageRange(formatSelectedPagesToRange(next, pages.length));
            return next;
        });
    };

    const handleSelectAll = () => {
        const all = new Set(pages.map(p => p.pageNumber));
        setSelectedPages(all);
        setPageRange(pages.length > 1 ? `1-${pages.length}` : "1");
    };

    const handleDeselectAll = () => {
        setSelectedPages(new Set());
        setPageRange("");
    };

    const handleRangeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setPageRange(val);
        const parsed = parsePageRange(val, pages.length);
        setSelectedPages(parsed);
    };

    const handleClearAll = () => {
        setPdfFile(null);
        setPages([]);
        setSelectedPages(new Set());
        setPageRange("");
        setDocxBlob(null);
        setErrorMessage(null);
        setConvertProgress(0);
        setIsConverting(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const convertToDocx = async (pageTexts: { pageNumber: number; text: string }[]): Promise<Blob> => {
        const paragraphs: Paragraph[] = [];

        pageTexts.forEach((item, index) => {
            // Add page header marker if multiple pages
            if (pageTexts.length > 1) {
                paragraphs.push(
                    new Paragraph({
                        text: `--- Halaman ${item.pageNumber} ---`,
                        heading: HeadingLevel.HEADING_3,
                        alignment: AlignmentType.CENTER,
                        spacing: { before: index > 0 ? 300 : 0, after: 150 },
                    })
                );
            }

            const rawParas = item.text.split("\n\n");
            rawParas.forEach(para => {
                const trimmed = para.trim();
                if (!trimmed) {
                    paragraphs.push(new Paragraph({ text: "" }));
                    return;
                }

                // Heading heuristic: short and UPPERCASE
                if (trimmed.length < 90 && trimmed === trimmed.toUpperCase() && trimmed.length > 3) {
                    paragraphs.push(
                        new Paragraph({
                            text: trimmed,
                            heading: HeadingLevel.HEADING_2,
                            alignment: AlignmentType.LEFT,
                            spacing: { before: 200, after: 100 }
                        })
                    );
                } else {
                    paragraphs.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: trimmed,
                                    size: 24, // 12pt
                                }),
                            ],
                            spacing: { after: 160 },
                        })
                    );
                }
            });
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: paragraphs.length > 0 ? paragraphs : [new Paragraph({ text: "(Halaman tidak memuat teks)" })],
            }],
        });

        return await Packer.toBlob(doc);
    };

    const handleConvert = async () => {
        if (!pdfFile || selectedPages.size === 0) return;
        setIsConverting(true);
        setErrorMessage(null);
        setDocxBlob(null);
        setConvertProgress(0);

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
            const targetPageNums = Array.from(selectedPages).sort((a, b) => a - b);
            const extractedData: { pageNumber: number; text: string }[] = [];

            for (let idx = 0; idx < targetPageNums.length; idx++) {
                const pageNum = targetPageNums[idx];
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(" ");

                extractedData.push({
                    pageNumber: pageNum,
                    text: pageText
                });

                const pct = Math.round(((idx + 1) / targetPageNums.length) * 100);
                setConvertProgress(pct);
            }

            const docx = await convertToDocx(extractedData);
            setDocxBlob(docx);
            setConvertedPageCount(targetPageNums.length);
        } catch (err: any) {
            console.error("Gagal konversi ke DOCX:", err);
            setErrorMessage("Terjadi kesalahan saat mengekstrak teks dari PDF. Silakan coba kembali.");
        } finally {
            setIsConverting(false);
            setConvertProgress(0);
        }
    };

    const handleDownloadDocx = () => {
        if (!docxBlob || !pdfFile) return;
        const url = URL.createObjectURL(docxBlob);
        const a = document.createElement("a");
        a.href = url;
        const baseName = pdfFile.name.replace(/\.[^/.]+$/, "");
        a.download = `${baseName}-converted.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Prepare Lightbox items
    const lightboxItems: LightboxItem[] = pages.map(p => ({
        title: `Halaman ${p.pageNumber}`,
        url: p.dataUrl,
        width: p.width,
        height: p.height,
        aspectRatio: p.aspectRatio
    }));

    return (
        <div className="space-y-8 w-full">
            {/* Hidden file input */}
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
                        aria-label="Tutup pesan"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {!pdfFile ? (
                <div className="animate-fade-in">
                    <Dropzone
                        onFilesAccepted={handleFiles}
                        accept="application/pdf"
                        title="Tarik & Letakkan Dokumen PDF ke Sini"
                        description="Mendukung konversi PDF ke dokumen Word (.docx) yang dapat diedit secara instan dan 100% offline."
                        icons={
                            <div className="flex items-center gap-1.5 font-bold text-blue-400">
                                <FileText className="w-5 h-5" />
                                <span>Dokumen PDF (.pdf)</span>
                            </div>
                        }
                    />
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    {/* Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface/60 border border-border/60 backdrop-blur-md shadow-sm">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-base sm:text-lg text-foreground truncate max-w-sm sm:max-w-md">
                                    {pdfFile.name}
                                </span>
                                <div className="flex items-center gap-2 text-xs text-foreground/60 mt-0.5">
                                    <span>{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                    <span>•</span>
                                    <span className="text-blue-400 font-semibold">{pages.length} Halaman Terdeteksi</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-foreground/80 hover:text-rose-400 bg-surface hover:bg-rose-500/10 border border-border/80 hover:border-rose-500/30 rounded-xl transition-all active:scale-95 cursor-pointer"
                                title="Hapus berkas dan reset pilihan"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Clear Semua</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                                title="Ganti dengan berkas PDF lain"
                            >
                                <FolderOpen className="w-4 h-4" />
                                <span>Ganti Berkas</span>
                            </button>
                        </div>
                    </div>

                    {/* Loading Pages Progress */}
                    {isLoadingPages && (
                        <div className="flex flex-col items-center justify-center p-12 glass-panel rounded-2xl border border-border/80 space-y-4">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                            <p className="text-sm font-medium text-foreground/80 animate-pulse">{loadingProgress}</p>
                        </div>
                    )}

                    {/* Result Card if Already Converted */}
                    {docxBlob && !isConverting && (
                        <div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-6 max-w-2xl mx-auto shadow-2xl shadow-emerald-500/10 animate-fade-in">
                            <div className="w-16 h-16 mx-auto bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-emerald-400">Konversi ke Word Selesai!</h3>
                                <p className="text-foreground/80 text-sm max-w-md mx-auto">
                                    Sebanyak <strong className="text-foreground">{convertedPageCount} halaman</strong> dari dokumen PDF Anda berhasil diekstrak dan ditata rapi ke dalam format Word (.docx).
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleDownloadDocx}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95 cursor-pointer"
                                >
                                    <Download className="w-5 h-5" />
                                    <span>Unduh Dokumen Word ({(docxBlob.size / 1024).toFixed(1)} KB)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDocxBlob(null)}
                                    className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-surface hover:bg-surface/80 text-foreground font-semibold border border-border transition-all hover:scale-105 active:scale-95 cursor-pointer text-sm"
                                >
                                    Pilih Halaman Lain
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Page Selection & Conversion Controls */}
                    {!isLoadingPages && pages.length > 0 && (
                        <div className="space-y-6">
                            {/* Controls Card */}
                            <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-border/80 shadow-md space-y-4">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-base text-foreground">
                                                Pilih Halaman yang Ingin Dikonversi
                                            </h3>
                                            <span className="text-xs bg-blue-500/10 text-blue-400 font-bold px-2.5 py-0.5 rounded-full border border-blue-500/20">
                                                {selectedPages.size} dari {pages.length} dipilih
                                            </span>
                                        </div>
                                        <p className="text-xs text-foreground/60">
                                            Centang halaman secara manual pada kartu atau ketik rentang halaman di bawah.
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleSelectAll}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-semibold text-foreground/80 hover:text-blue-400 hover:border-blue-500/40 transition-colors cursor-pointer"
                                        >
                                            <CheckSquare className="w-3.5 h-3.5" />
                                            <span>Pilih Semua</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDeselectAll}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-semibold text-foreground/80 hover:text-rose-400 hover:border-rose-500/40 transition-colors cursor-pointer"
                                        >
                                            <Square className="w-3.5 h-3.5" />
                                            <span>Hapus Pilihan</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleConvert}
                                            disabled={isConverting || selectedPages.size === 0}
                                            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white transition-all shadow-md cursor-pointer ${
                                                isConverting || selectedPages.size === 0
                                                    ? "bg-blue-600/40 cursor-not-allowed text-white/60"
                                                    : "bg-blue-600 hover:bg-blue-500 hover:scale-105 active:scale-95 shadow-blue-500/25"
                                            }`}
                                        >
                                            {isConverting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Mengekstrak {convertProgress}%...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Konversi ke Word</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Range Input */}
                                <div className="pt-3 border-t border-border/40 flex flex-col sm:flex-row sm:items-center gap-3">
                                    <label htmlFor="range-input" className="text-xs font-bold uppercase tracking-wider text-foreground/70 shrink-0">
                                        Rentang Halaman:
                                    </label>
                                    <div className="flex-1 relative">
                                        <input
                                            id="range-input"
                                            type="text"
                                            value={pageRange}
                                            onChange={handleRangeInputChange}
                                            placeholder="Contoh: 1-3, 5, 8-10"
                                            className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border/80 text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                    <span className="text-[11px] text-foreground/50">
                                        Ketik angka halaman dipisah koma (contoh: 1-5, 7)
                                    </span>
                                </div>
                            </div>

                            {/* Visual Grid of Pages */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {pages.map((p, idx) => {
                                    const isSelected = selectedPages.has(p.pageNumber);
                                    return (
                                        <div
                                            key={p.pageNumber}
                                            onClick={() => handleTogglePage(p.pageNumber)}
                                            className={`relative group rounded-xl border transition-all cursor-pointer overflow-hidden flex flex-col ${
                                                isSelected
                                                    ? "bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/20 shadow-md shadow-blue-500/10"
                                                    : "bg-surface/50 border-border/60 hover:border-border hover:bg-surface opacity-60 hover:opacity-100"
                                            }`}
                                        >
                                            {/* Top selection bar */}
                                            <div className="p-2 flex items-center justify-between bg-surface/70 border-b border-border/40 text-xs font-medium">
                                                <span className="font-bold text-foreground">
                                                    Hal {p.pageNumber}
                                                </span>
                                                <div
                                                    className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                                                        isSelected ? "bg-blue-600 text-white" : "border border-border/80"
                                                    }`}
                                                >
                                                    {isSelected && <CheckSquare className="w-3 h-3" />}
                                                </div>
                                            </div>

                                            {/* Thumbnail Container (rounded-none for sharp corners) */}
                                            <div className="relative aspect-3/4 bg-neutral-900/40 flex items-center justify-center overflow-hidden">
                                                {p.dataUrl ? (
                                                    <img
                                                        src={p.dataUrl}
                                                        alt={`Halaman ${p.pageNumber}`}
                                                        className="w-full h-full object-contain rounded-none select-none transition-transform group-hover:scale-102"
                                                    />
                                                ) : (
                                                    <FileText className="w-8 h-8 text-foreground/30" />
                                                )}

                                                {/* Hover Eye Overlay to open Lightbox */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setLightboxIndex(idx);
                                                    }}
                                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white cursor-pointer"
                                                    title="Pratinjau detail halaman (Zoom & Pan)"
                                                >
                                                    <div className="p-2 rounded-full bg-white/20 backdrop-blur-md">
                                                        <Eye className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-[10px] font-semibold tracking-wider uppercase">
                                                        Perbesar
                                                    </span>
                                                </button>
                                            </div>

                                            {/* Bottom metadata */}
                                            <div className="p-1.5 text-center text-[10px] text-foreground/50 border-t border-border/30 bg-surface/40">
                                                {p.aspectRatio}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Media Lightbox Modal with Zoom & Pan */}
            <MediaLightboxModal
                isOpen={lightboxIndex !== null}
                item={lightboxIndex !== null ? lightboxItems[lightboxIndex] : null}
                onClose={() => setLightboxIndex(null)}
                onNavigatePrev={() => lightboxIndex !== null && setLightboxIndex(Math.max(0, lightboxIndex - 1))}
                onNavigateNext={() => lightboxIndex !== null && setLightboxIndex(Math.min(lightboxItems.length - 1, lightboxIndex + 1))}
                hasPrev={lightboxIndex !== null && lightboxIndex > 0}
                hasNext={lightboxIndex !== null && lightboxIndex < lightboxItems.length - 1}
                accentColor="blue"
            />
        </div>
    );
}
