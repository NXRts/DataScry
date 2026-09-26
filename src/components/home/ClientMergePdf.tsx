"use client";

import { useState, useRef, useEffect } from "react";
import Dropzone from "@/components/ui/Dropzone";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";
import { PDFDocument } from "pdf-lib";
import {
    Files,
    Sparkles,
    ChevronUp,
    ChevronDown,
    Trash2,
    RotateCcw,
    Plus,
    FileText,
    CheckCircle2,
    Eye,
    AlertCircle,
    X,
    ArrowUpDown,
    Download
} from "lucide-react";
import MediaLightboxModal, { LightboxItem } from "@/components/shared/MediaLightboxModal";
import PdfEmbeddedViewer from "@/components/shared/PdfEmbeddedViewer";

// Configure PDF.js worker using local public worker
if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

interface MergePdfItem {
    id: string;
    file: File;
    name: string;
    size: number;
    pageCount: number;
    thumbnailUrl: string;
    width: number;
    height: number;
    aspectRatio: string;
}

export default function ClientMergePdf() {
    const [pdfItems, setPdfItems] = useState<MergePdfItem[]>([]);
    const [isRenderingThumbnails, setIsRenderingThumbnails] = useState(false);
    const [renderingStatus, setRenderingStatus] = useState<string>("");
    
    // Processing states
    const [isProcessing, setIsProcessing] = useState(false);
    const [processPercent, setProcessPercent] = useState<number>(0);
    const [processStatus, setProcessStatus] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Merged Result
    const [mergedPdfBlob, setMergedPdfBlob] = useState<Blob | null>(null);
    const [mergedTotalPages, setMergedTotalPages] = useState<number>(0);

    // Lightbox Modal
    const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatAspectRatio = (width: number, height: number): string => {
        const ratio = width / height;
        if (Math.abs(ratio - 16 / 9) < 0.08) return "16:9";
        if (Math.abs(ratio - 9 / 16) < 0.08) return "9:16";
        if (Math.abs(ratio - 1 / 1.414) < 0.08) return "A4 Portrait";
        if (Math.abs(ratio - 1.414 / 1) < 0.08) return "A4 Landscape";
        return ratio >= 1 ? "Landscape" : "Portrait";
    };

    // Process new files into items with thumbnails
    const handleFiles = async (newFiles: File[]) => {
        const pdfFiles = newFiles.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
        if (pdfFiles.length === 0) {
            setErrorMessage("Silakan pilih berkas dengan format PDF yang valid.");
            return;
        }

        setIsRenderingThumbnails(true);
        setErrorMessage(null);
        setMergedPdfBlob(null);

        const newItems: MergePdfItem[] = [];

        for (let i = 0; i < pdfFiles.length; i++) {
            const file = pdfFiles[i];
            setRenderingStatus(`Membaca sampul ${file.name} (${i + 1}/${pdfFiles.length})...`);

            try {
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
                const pdf = await loadingTask.promise;
                const totalPages = pdf.numPages;

                // Render page 1 as cover
                const page1 = await pdf.getPage(1);
                const viewport = page1.getViewport({ scale: 0.65 });
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");

                let thumbnailUrl = "";
                let width = 595;
                let height = 842;
                let aspectRatio = "A4 Portrait";

                if (context) {
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    await page1.render({ canvasContext: context, viewport, canvas }).promise;
                    thumbnailUrl = canvas.toDataURL("image/jpeg", 0.85);
                    width = Math.round(viewport.width / 0.65);
                    height = Math.round(viewport.height / 0.65);
                    aspectRatio = formatAspectRatio(viewport.width, viewport.height);
                }

                newItems.push({
                    id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                    file,
                    name: file.name,
                    size: file.size,
                    pageCount: totalPages,
                    thumbnailUrl,
                    width,
                    height,
                    aspectRatio
                });
            } catch (error) {
                console.error("Error reading PDF cover:", error);
                // Fallback item without thumbnail
                newItems.push({
                    id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                    file,
                    name: file.name,
                    size: file.size,
                    pageCount: 1,
                    thumbnailUrl: "",
                    width: 595,
                    height: 842,
                    aspectRatio: "Dokumen PDF"
                });
            }
        }

        setPdfItems(prev => [...prev, ...newItems]);
        setIsRenderingThumbnails(false);
        setRenderingStatus("");
    };

    // Reordering actions
    const moveItemUp = (index: number) => {
        if (index <= 0) return;
        setPdfItems(prev => {
            const next = [...prev];
            const temp = next[index - 1];
            next[index - 1] = next[index];
            next[index] = temp;
            return next;
        });
        setMergedPdfBlob(null);
    };

    const moveItemDown = (index: number) => {
        if (index >= pdfItems.length - 1) return;
        setPdfItems(prev => {
            const next = [...prev];
            const temp = next[index + 1];
            next[index + 1] = next[index];
            next[index] = temp;
            return next;
        });
        setMergedPdfBlob(null);
    };

    const removeItem = (id: string) => {
        setPdfItems(prev => prev.filter(item => item.id !== id));
        setMergedPdfBlob(null);
    };

    const handleClearAll = () => {
        setPdfItems([]);
        setMergedPdfBlob(null);
        setMergedTotalPages(0);
        setErrorMessage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Lightbox preview for cover thumbnail
    const openLightbox = (index: number) => {
        const item = pdfItems[index];
        if (!item || !item.thumbnailUrl) return;
        setLightboxIndex(index);
        setLightboxItem({
            url: item.thumbnailUrl,
            title: `Sampul: ${item.name}`,
            pageNumber: 1,
            totalPages: item.pageCount,
            width: item.width,
            height: item.height,
            size: item.size,
            aspectRatio: item.aspectRatio
        });
    };

    const navigateLightbox = (nextIndex: number) => {
        if (nextIndex < 0 || nextIndex >= pdfItems.length) return;
        openLightbox(nextIndex);
    };

    // Execute merge
    const mergePdfs = async () => {
        if (pdfItems.length < 2) {
            setErrorMessage("Silakan pilih minimal 2 dokumen PDF untuk digabungkan.");
            return;
        }

        setIsProcessing(true);
        setProcessPercent(10);
        setProcessStatus("Membuat wadah dokumen gabungan...");
        setErrorMessage(null);
        setMergedPdfBlob(null);

        try {
            const mergedPdfDoc = await PDFDocument.create();
            const totalDocs = pdfItems.length;
            let cumulativePages = 0;

            for (let i = 0; i < totalDocs; i++) {
                const item = pdfItems[i];
                const percent = Math.round(15 + ((i + 1) / totalDocs) * 70);
                setProcessPercent(percent);
                setProcessStatus(`Menggabungkan dokumen ${i + 1} dari ${totalDocs}: ${item.name}...`);

                const fileBuffer = await item.file.arrayBuffer();
                const sourcePdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
                const pageIndices = sourcePdfDoc.getPageIndices();
                cumulativePages += pageIndices.length;

                const copiedPages = await mergedPdfDoc.copyPages(sourcePdfDoc, pageIndices);
                copiedPages.forEach((page) => mergedPdfDoc.addPage(page));
            }

            setProcessStatus("Menyimpan dokumen PDF gabungan...");
            setProcessPercent(92);

            const pdfBytes = await mergedPdfDoc.save();
            const resultBlob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });

            setMergedPdfBlob(resultBlob);
            setMergedTotalPages(cumulativePages);
            setProcessPercent(100);
        } catch (error) {
            console.error("Error merging PDFs:", error);
            setErrorMessage("Terjadi kesalahan saat menggabungkan berkas PDF. Pastikan dokumen tidak terkunci kata sandi.");
        } finally {
            setIsProcessing(false);
        }
    };

    const totalPagesToMerge = pdfItems.reduce((acc, curr) => acc + curr.pageCount, 0);
    const totalInputSize = pdfItems.reduce((acc, curr) => acc + curr.size, 0);

    return (
        <div className="space-y-8 w-full max-w-5xl mx-auto">
            {/* Hidden Input for direct file picking */}
            <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        handleFiles(Array.from(e.target.files));
                    }
                }}
            />

            {/* In-App Error Notification */}
            {errorMessage && (
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-start justify-between gap-3 text-purple-400 animate-fade-in shadow-lg">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 text-purple-500" />
                        <span className="text-sm font-semibold">{errorMessage}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setErrorMessage(null)}
                        className="p-1 hover:bg-purple-500/20 rounded-lg text-purple-400 transition-colors"
                        title="Tutup pesan"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Dropzone Utama */}
            {pdfItems.length === 0 ? (
                <Dropzone
                    onFilesAccepted={handleFiles}
                    accept="application/pdf"
                    title="Upload Beberapa PDF untuk Digabung"
                    description="Pilih atau seret beberapa dokumen PDF sekaligus. Anda dapat mengatur urutan sebelum digabungkan."
                    icons={
                        <div className="flex items-center gap-2">
                            <Files className="w-5 h-5 text-purple-500" />
                            <span className="text-purple-500 font-bold">Dokumen PDF</span>
                        </div>
                    }
                />
            ) : (
                /* Daftar Dokumen untuk Digabung & Reordering */
                <div className="space-y-6 animate-fade-in">
                    {/* Header Ringkasan & Tombol Aksi */}
                    <div className="p-4 sm:p-6 glass-panel rounded-2xl border border-purple-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-xl shrink-0 shadow-inner">
                                <Files className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-xl font-bold text-foreground">
                                    Dokumen untuk Digabung ({pdfItems.length})
                                </h2>
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground/60">
                                    <span>{(totalInputSize / 1024 / 1024).toFixed(2)} MB total</span>
                                    <span>•</span>
                                    <span className="font-semibold text-purple-400">{totalPagesToMerge} Halaman</span>
                                </div>
                            </div>
                        </div>

                        {/* Tombol Tambah Berkas & Clear Data */}
                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3.5 py-2 rounded-xl bg-surface/80 border border-border/80 hover:bg-surface text-foreground/80 hover:text-foreground text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5 text-purple-400" />
                                <span>Tambah PDF</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Hapus semua berkas dan mulai ulang"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Clear Semua</span>
                            </button>
                        </div>
                    </div>

                    {/* Feedback saat merender cover */}
                    {isRenderingThumbnails && (
                        <div className="p-4 rounded-xl glass-panel border border-border flex items-center justify-center gap-2 text-xs text-purple-400 animate-fade-in">
                            <Sparkles className="w-4 h-4 animate-spin" />
                            <span>{renderingStatus}</span>
                        </div>
                    )}

                    {/* Petunjuk Reordering */}
                    <div className="p-3 px-4 rounded-xl bg-purple-500/5 border border-purple-500/10 text-xs text-foreground/60 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                            <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
                            <span>Urutan di bawah menentukan posisi halaman dalam dokumen PDF akhir. Gunakan panah naik/turun untuk mengatur urutan.</span>
                        </span>
                    </div>

                    {/* List Dokumen dengan Cover Thumbnail & Reordering Controls */}
                    <div className="space-y-3">
                        {pdfItems.map((item, idx) => (
                            <div
                                key={item.id}
                                className="p-3 sm:p-4 rounded-2xl glass-panel border border-border/80 flex items-center justify-between gap-3 hover:border-purple-500/40 transition-all shadow-md group"
                            >
                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                    {/* Nomor Urutan */}
                                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 font-bold text-xs flex items-center justify-center shrink-0 border border-purple-500/20">
                                        #{idx + 1}
                                    </div>

                                    {/* Cover Thumbnail Clickable for Lightbox */}
                                    <div
                                        onClick={() => openLightbox(idx)}
                                        className="w-12 h-16 sm:w-14 sm:h-20 rounded-lg bg-neutral-950/60 border border-border/60 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer relative group/thumb shadow-sm"
                                        title="Klik untuk melihat sampul dokumen (Zoom & Pan)"
                                    >
                                        {item.thumbnailUrl ? (
                                            <img
                                                src={item.thumbnailUrl}
                                                alt={`Sampul ${item.name}`}
                                                className="max-h-full max-w-full object-contain rounded-none pointer-events-none"
                                            />
                                        ) : (
                                            <FileText className="w-6 h-6 text-foreground/40" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                            <Eye className="w-4 h-4 text-purple-400" />
                                        </div>
                                    </div>

                                    {/* Detail Berkas */}
                                    <div className="min-w-0">
                                        <h4 className="font-semibold text-xs sm:text-sm text-foreground truncate max-w-45 sm:max-w-xs md:max-w-md">
                                            {item.name}
                                        </h4>
                                        <div className="flex items-center gap-2 text-[11px] text-foreground/50 mt-0.5">
                                            <span className="font-bold text-purple-400">{item.pageCount} Halaman</span>
                                            <span>•</span>
                                            <span>{(item.size / 1024 / 1024).toFixed(2)} MB</span>
                                            <span className="hidden sm:inline">•</span>
                                            <span className="hidden sm:inline">{item.aspectRatio}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Reordering Controls & Delete */}
                                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => moveItemUp(idx)}
                                        disabled={idx === 0}
                                        className="p-1.5 sm:p-2 rounded-xl bg-surface/80 border border-border/70 text-foreground/70 hover:text-foreground hover:bg-surface disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
                                        title="Pindah ke atas"
                                    >
                                        <ChevronUp className="w-4 h-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => moveItemDown(idx)}
                                        disabled={idx === pdfItems.length - 1}
                                        className="p-1.5 sm:p-2 rounded-xl bg-surface/80 border border-border/70 text-foreground/70 hover:text-foreground hover:bg-surface disabled:opacity-20 disabled:pointer-events-none transition-colors cursor-pointer"
                                        title="Pindah ke bawah"
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => removeItem(item.id)}
                                        className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer ml-1"
                                        title="Hapus berkas ini"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Progress Bar Pemrosesan */}
                    {isProcessing && (
                        <div className="p-5 rounded-2xl bg-surface/90 border border-purple-500/30 space-y-2.5 animate-fade-in shadow-xl">
                            <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-foreground/80 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-500 animate-spin" />
                                    <span>{processStatus}</span>
                                </span>
                                <span className="text-purple-400 font-bold">{processPercent}%</span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-neutral-900 overflow-hidden p-0.5">
                                <div
                                    className="h-full bg-linear-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-300 shadow-sm"
                                    style={{ width: `${processPercent}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Tombol Eksekusi Gabungkan PDF */}
                    <button
                        type="button"
                        onClick={mergePdfs}
                        disabled={isProcessing || pdfItems.length < 2}
                        className={`w-full py-4 rounded-xl font-bold text-white text-sm sm:text-base transition-all shadow-xl flex items-center justify-center gap-2.5 cursor-pointer ${
                            isProcessing || pdfItems.length < 2
                                ? "bg-purple-500/40 cursor-not-allowed shadow-none"
                                : "bg-purple-500 hover:bg-purple-600 shadow-purple-500/25 hover:scale-[1.005]"
                        }`}
                    >
                        <Files className="w-5 h-5" />
                        <span>
                            {isProcessing
                                ? "Sedang Menggabungkan Seluruh Dokumen..."
                                : pdfItems.length < 2
                                ? "Pilih Minimal 2 Dokumen PDF"
                                : `Gabungkan ${pdfItems.length} PDF Menjadi 1 Dokumen (${totalPagesToMerge} Halaman)`}
                        </span>
                    </button>
                </div>
            )}

            {/* Output: Hasil Penggabungan PDF (Embedded Live PDF Viewer) */}
            {mergedPdfBlob && (
                <div className="space-y-4 animate-fade-in">
                    <PdfEmbeddedViewer
                        blob={mergedPdfBlob}
                        fileName={`datascry_gabungan_${Date.now()}.pdf`}
                        title={`Dokumen PDF Gabungan (${mergedTotalPages} Halaman) Berhasil Dibuat!`}
                        accentColor="purple"
                    />
                </div>
            )}

            {/* Modal Lightbox Reusable untuk melihat Sampul PDF */}
            <MediaLightboxModal
                isOpen={lightboxItem !== null}
                onClose={() => setLightboxItem(null)}
                item={lightboxItem}
                onNavigatePrev={() => lightboxIndex !== null && navigateLightbox(lightboxIndex - 1)}
                onNavigateNext={() => lightboxIndex !== null && navigateLightbox(lightboxIndex + 1)}
                hasPrev={lightboxIndex !== null && lightboxIndex > 0}
                hasNext={lightboxIndex !== null && lightboxIndex < pdfItems.length - 1}
                accentColor="purple"
            />
        </div>
    );
}
