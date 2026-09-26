"use client";

import { useState, useRef, useEffect } from "react";
import Dropzone from "@/components/ui/Dropzone";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";
import { PDFDocument, degrees } from "pdf-lib";
import {
    RotateCw,
    RotateCcw,
    Download,
    FileText,
    Sparkles,
    CheckCircle2,
    Loader2,
    HardDrive,
    FolderOpen,
    Check,
    RefreshCw,
    Eye,
    AlertCircle,
    X,
    ZoomIn
} from "lucide-react";
import MediaLightboxModal, { LightboxItem } from "@/components/shared/MediaLightboxModal";
import PdfEmbeddedViewer from "@/components/shared/PdfEmbeddedViewer";

// Configure PDF.js worker using local public worker
if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

interface PageThumbnail {
    pageNumber: number;
    dataUrl: string;
    width: number;
    height: number;
    initialRotation: number;
    aspectRatio: string;
}

export default function ClientRotatePdf() {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingProgress, setLoadingProgress] = useState<string>("");
    const [pages, setPages] = useState<PageThumbnail[]>([]);
    const [pageRotations, setPageRotations] = useState<number[]>([]);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isSaved, setIsSaved] = useState<boolean>(false);
    const [savedPdfBlob, setSavedPdfBlob] = useState<Blob | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Lightbox modal state
    const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatAspectRatio = (width: number, height: number): string => {
        const ratio = width / height;
        if (Math.abs(ratio - 16 / 9) < 0.08) return "16:9 Landscape";
        if (Math.abs(ratio - 9 / 16) < 0.08) return "9:16 Portrait";
        if (Math.abs(ratio - 1 / 1.414) < 0.08) return "A4 Portrait";
        if (Math.abs(ratio - 1.414 / 1) < 0.08) return "A4 Landscape";
        return ratio >= 1 ? "Landscape" : "Portrait";
    };

    const handleFileAccepted = async (acceptedFiles: File[]) => {
        const pdfFile = acceptedFiles.find(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
        if (!pdfFile) {
            setErrorMessage("Silakan pilih berkas dokumen berformat PDF yang valid.");
            return;
        }

        setFile(pdfFile);
        setIsLoading(true);
        setErrorMessage(null);
        setPages([]);
        setPageRotations([]);
        setIsSaved(false);
        setSavedPdfBlob(null);
        setLoadingProgress("Membaca berkas PDF...");

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
            const pdf = await loadingTask.promise;
            const totalPages = pdf.numPages;

            const loadedThumbnails: PageThumbnail[] = [];
            const initialRotations: number[] = [];

            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                setLoadingProgress(`Merender pratinjau halaman ${pageNum} dari ${totalPages}...`);
                const page = await pdf.getPage(pageNum);
                
                const viewport = page.getViewport({ scale: 0.65 });
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");

                if (context) {
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    await page.render({ canvasContext: context, viewport, canvas }).promise;
                    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

                    loadedThumbnails.push({
                        pageNumber: pageNum,
                        dataUrl,
                        width: Math.round(viewport.width / 0.65),
                        height: Math.round(viewport.height / 0.65),
                        initialRotation: page.rotate || 0,
                        aspectRatio: formatAspectRatio(viewport.width, viewport.height)
                    });
                } else {
                    loadedThumbnails.push({
                        pageNumber: pageNum,
                        dataUrl: "",
                        width: 595,
                        height: 842,
                        initialRotation: page.rotate || 0,
                        aspectRatio: "A4 Portrait"
                    });
                }

                initialRotations.push(0);
            }

            setPages(loadedThumbnails);
            setPageRotations(initialRotations);
        } catch (error) {
            console.error("Error loading PDF pages:", error);
            setErrorMessage("Gagal memuat pratinjau PDF. Pastikan dokumen tidak rusak atau diproteksi kata sandi.");
            setFile(null);
        } finally {
            setIsLoading(false);
            setLoadingProgress("");
        }
    };

    const handleClear = () => {
        setFile(null);
        setPages([]);
        setPageRotations([]);
        setIsSaved(false);
        setSavedPdfBlob(null);
        setIsLoading(false);
        setErrorMessage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const rotateSinglePage = (index: number, delta: number) => {
        setPageRotations(prev => {
            const updated = [...prev];
            const newAngle = ((updated[index] + delta) % 360 + 360) % 360;
            updated[index] = newAngle;
            return updated;
        });
        setIsSaved(false);
        setSavedPdfBlob(null);
    };

    const rotateAllPages = (delta: number) => {
        setPageRotations(prev =>
            prev.map(angle => ((angle + delta) % 360 + 360) % 360)
        );
        setIsSaved(false);
        setSavedPdfBlob(null);
    };

    const resetAllRotations = () => {
        setPageRotations(pages.map(() => 0));
        setIsSaved(false);
        setSavedPdfBlob(null);
    };

    // Open lightbox
    const openLightbox = (index: number) => {
        const p = pages[index];
        if (!p) return;
        const currentRot = pageRotations[index] || 0;
        setLightboxIndex(index);
        setLightboxItem({
            url: p.dataUrl,
            title: `Halaman ${p.pageNumber} (${file?.name || "PDF"}) • Rotasi +${currentRot}°`,
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

    const saveRotatedPdf = async () => {
        if (!file || pages.length === 0) return;
        setIsSaving(true);
        setErrorMessage(null);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const docPages = pdfDoc.getPages();

            docPages.forEach((docPage, idx) => {
                const added = pageRotations[idx] || 0;
                if (added !== 0) {
                    const currentAngle = docPage.getRotation().angle;
                    const finalAngle = ((currentAngle + added) % 360 + 360) % 360;
                    docPage.setRotation(degrees(finalAngle));
                }
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });

            setSavedPdfBlob(blob);
            setIsSaved(true);
        } catch (error) {
            console.error("Failed to save rotated PDF:", error);
            setErrorMessage("Gagal menyimpan dokumen PDF yang diputar. Silakan coba kembali.");
        } finally {
            setIsSaving(false);
        }
    };

    const hasAnyRotation = pageRotations.some(angle => angle !== 0);

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
                        handleFileAccepted(Array.from(e.target.files));
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

            {!file ? (
                <Dropzone
                    onFilesAccepted={handleFileAccepted}
                    accept="application/pdf"
                    title="Upload PDF untuk Diputar"
                    description="Pilih atau seret dokumen PDF yang orientasi halamannya perlu diperbaiki. 100% diproses di browser Anda."
                    icons={
                        <div className="flex items-center gap-2">
                            <RotateCw className="w-5 h-5 text-rose-500" />
                            <span className="text-rose-500 font-bold">Dokumen PDF</span>
                        </div>
                    }
                />
            ) : (
                <div className="space-y-6 animate-fade-in">
                    {/* File Header & Clear Data */}
                    <div className="p-4 sm:p-6 rounded-2xl glass-panel border border-rose-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-xl shrink-0 shadow-inner">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-base sm:text-xl font-bold truncate max-w-xs sm:max-w-md md:max-w-lg text-foreground">
                                    {file.name}
                                </h3>
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground/60">
                                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    <span>•</span>
                                    <span className="font-semibold text-rose-400">
                                        {pages.length > 0 ? `${pages.length} Halaman` : "Membaca..."}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons: Ganti & Clear Semua */}
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
                                onClick={handleClear}
                                className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Hapus berkas dan reset form"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Clear Semua</span>
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar Loading Halaman */}
                    {isLoading && (
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

                    {/* Toolbar Global Rotasi Seluruh Dokumen */}
                    {pages.length > 0 && (
                        <div className="p-4 sm:p-5 rounded-2xl glass-panel border border-border flex flex-wrap items-center justify-between gap-4 shadow-xl">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-foreground/80 uppercase tracking-wide">
                                    Putar Sekaligus:
                                </span>
                                <div className="flex items-center gap-1.5 bg-surface/80 p-1 rounded-xl border border-border">
                                    <button
                                        type="button"
                                        onClick={() => rotateAllPages(-90)}
                                        className="px-3 py-1.5 rounded-lg hover:bg-surface text-foreground/80 hover:text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                        title="Putar semua halaman -90° ke kiri"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                                        <span>Semua -90°</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => rotateAllPages(90)}
                                        className="px-3 py-1.5 rounded-lg hover:bg-surface text-foreground/80 hover:text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                        title="Putar semua halaman +90° ke kanan"
                                    >
                                        <RotateCw className="w-3.5 h-3.5 text-rose-500" />
                                        <span>Semua +90°</span>
                                    </button>
                                </div>

                                {hasAnyRotation && (
                                    <button
                                        type="button"
                                        onClick={resetAllRotations}
                                        className="px-3 py-1.5 rounded-xl bg-surface border border-border/80 text-foreground/60 hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        <span>Reset (0°)</span>
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={saveRotatedPdf}
                                disabled={isSaving}
                                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer ${
                                    isSaving
                                        ? "bg-rose-500/50 cursor-not-allowed"
                                        : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 hover:scale-[1.02] active:scale-95"
                                }`}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Menyimpan PDF...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        <span>Simpan & Tampilkan PDF</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Interactive Grid Halaman dengan Zoom Lightbox & Rotasi */}
                    {pages.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs text-foreground/60 px-1">
                                <span>Total {pages.length} Halaman. Klik pratinjau untuk memperbesar (Zoom & Pan).</span>
                                <span className="flex items-center gap-1 text-rose-400">
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Pratinjau Detail</span>
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                                {pages.map((p, idx) => {
                                    const rotation = pageRotations[idx] || 0;
                                    const isRotated = rotation !== 0;

                                    return (
                                        <div
                                            key={p.pageNumber}
                                            className={`group flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden ${
                                                isRotated
                                                    ? "bg-surface/90 border-rose-500/60 shadow-lg ring-1 ring-rose-500/30"
                                                    : "bg-surface/40 border-border/70 hover:border-border hover:bg-surface/60"
                                            }`}
                                        >
                                            {/* Header Kartu: Nomor & Sudut */}
                                            <div className="p-2 sm:px-3 bg-surface/60 border-b border-border/40 flex items-center justify-between text-xs">
                                                <span className="font-bold text-foreground/80">
                                                    Hal {p.pageNumber}
                                                </span>
                                                {isRotated ? (
                                                    <span className="px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-400 font-bold text-[10px] border border-rose-500/20">
                                                        +{rotation}°
                                                    </span>
                                                ) : (
                                                    <span className="text-foreground/40 text-[10px]">0°</span>
                                                )}
                                            </div>

                                            {/* Thumbnail Image Container with Zoom Click & Rotation CSS */}
                                            <div
                                                onClick={() => openLightbox(idx)}
                                                className="relative aspect-3/4 w-full flex items-center justify-center bg-black/40 overflow-hidden p-2 cursor-pointer group/thumb"
                                                title="Klik untuk membuka pratinjau zoom & membaca teks"
                                            >
                                                {p.dataUrl ? (
                                                    <img
                                                        src={p.dataUrl}
                                                        alt={`Halaman ${p.pageNumber}`}
                                                        className="max-w-full max-h-full object-contain rounded-none shadow transition-transform duration-300 ease-out pointer-events-none"
                                                        style={{
                                                            transform: `rotate(${rotation}deg)`,
                                                        }}
                                                    />
                                                ) : (
                                                    <FileText className="w-10 h-10 text-foreground/30" />
                                                )}

                                                {/* Hover Overlay Zoom Icon */}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                                    <div className="p-2 rounded-full bg-rose-500 text-white shadow-lg transform scale-90 group-hover/thumb:scale-100 transition-transform">
                                                        <ZoomIn className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons under each page */}
                                            <div className="grid grid-cols-2 gap-1.5 p-2 bg-surface/50 border-t border-border/40">
                                                <button
                                                    type="button"
                                                    onClick={() => rotateSinglePage(idx, -90)}
                                                    className="inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-surface hover:bg-rose-500/10 text-foreground/70 hover:text-rose-400 border border-border/50 text-xs transition-colors cursor-pointer"
                                                    title="Putar Kiri (-90°)"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-semibold">-90°</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => rotateSinglePage(idx, 90)}
                                                    className="inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-surface hover:bg-rose-500/10 text-foreground/70 hover:text-rose-400 border border-border/50 text-xs transition-colors cursor-pointer"
                                                    title="Putar Kanan (+90°)"
                                                >
                                                    <RotateCw className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-semibold">+90°</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Output: Embedded Live PDF Viewer setelah Simpan */}
                    {savedPdfBlob && (
                        <div className="space-y-4 pt-4 animate-fade-in">
                            <PdfEmbeddedViewer
                                blob={savedPdfBlob}
                                fileName={`${file.name.replace(/\.pdf$/i, "")}-terputar.pdf`}
                                title="Dokumen PDF Hasil Rotasi Siap Diunduh"
                                accentColor="rose"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Modal Lightbox Reusable untuk Membaca Halaman PDF */}
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
