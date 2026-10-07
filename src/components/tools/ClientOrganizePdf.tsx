"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Dropzone from "@/components/ui/Dropzone";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";
import { PDFDocument, degrees } from "pdf-lib";
import {
    FileStack,
    Download,
    FileText,
    Sparkles,
    CheckCircle2,
    Loader2,
    RotateCw,
    RotateCcw,
    Trash2,
    Copy,
    Eye,
    ChevronLeft,
    ChevronRight,
    GripVertical,
    ArrowUpDown,
    RotateCcw as ResetIcon,
    AlertCircle,
    Check,
    Layers,
    ZoomIn,
    Undo2,
    RefreshCw,
    X,
    MoveLeft,
    MoveRight
} from "lucide-react";
import MediaLightboxModal, { LightboxItem } from "@/components/shared/MediaLightboxModal";
import PdfEmbeddedViewer from "@/components/shared/PdfEmbeddedViewer";

// Setup PDF.js worker
if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

export interface OrganizePageItem {
    id: string;
    originalIndex: number; // 0-indexed in original document
    displayNumber: number; // original page number (1-indexed)
    thumbnailUrl: string;
    width: number;
    height: number;
    rotation: number; // additional rotation in degrees (0, 90, 180, 270)
}

export default function ClientOrganizePdf() {
    const [file, setFile] = useState<File | null>(null);
    const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
    const [pages, setPages] = useState<OrganizePageItem[]>([]);
    const [deletedPages, setDeletedPages] = useState<OrganizePageItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingProgress, setLoadingProgress] = useState<string>("");

    // Drag-and-drop state
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Save & output state
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveProgress, setSaveProgress] = useState<number>(0);
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [resultFileName, setResultFileName] = useState<string>("");
    const [resultSize, setResultSize] = useState<number>(0);
    const [resultThumbnailUrl, setResultThumbnailUrl] = useState<string | null>(null);

    // Lightbox modal state
    const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Load PDF & Generate Thumbnails
    const handleFileAccepted = async (acceptedFiles: File[]) => {
        if (!acceptedFiles || acceptedFiles.length === 0) return;
        const selected = acceptedFiles[0];

        if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
            setErrorMessage("Harap pilih berkas PDF yang valid.");
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);
        setResultBlob(null);
        setDeletedPages([]);
        setPages([]);

        try {
            setFile(selected);
            const arrayBuffer = await selected.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            setFileBytes(bytes);

            setLoadingProgress("Membaca struktur dokumen...");
            const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
            const pdf = await loadingTask.promise;
            const numPages = pdf.numPages;

            const loadedPages: OrganizePageItem[] = [];

            for (let i = 1; i <= numPages; i++) {
                setLoadingProgress(`Membuat pratinjau halaman ${i} dari ${numPages}...`);
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 0.6 });

                const canvas = document.createElement("canvas");
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const context = canvas.getContext("2d");

                if (context) {
                    await page.render({ canvasContext: context, viewport, canvas }).promise;
                    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

                    const unscaled = page.getViewport({ scale: 1.0 });
                    loadedPages.push({
                        id: `page-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                        originalIndex: i - 1,
                        displayNumber: i,
                        thumbnailUrl: dataUrl,
                        width: unscaled.width,
                        height: unscaled.height,
                        rotation: 0
                    });
                }
            }

            setPages(loadedPages);
        } catch (err: unknown) {
            console.error("Gagal memuat PDF:", err);
            setErrorMessage("Gagal memuat halaman PDF. Berkas mungkin terkunci kata sandi atau rusak.");
        } finally {
            setIsLoading(false);
            setLoadingProgress("");
        }
    };

    // Reorder Handlers (Drag & Drop)
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        setDragOverIndex(index);
    };

    const handleDrop = (index: number) => {
        if (draggedIndex === null || draggedIndex === index) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        setPages((prev) => {
            const next = [...prev];
            const [movedItem] = next.splice(draggedIndex, 1);
            next.splice(index, 0, movedItem);
            return next;
        });

        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    // Move single page with button (Accessible for Mobile & Desktop)
    const movePage = (currentIndex: number, direction: "left" | "right") => {
        const targetIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= pages.length) return;

        setPages((prev) => {
            const next = [...prev];
            const [item] = next.splice(currentIndex, 1);
            next.splice(targetIndex, 0, item);
            return next;
        });
    };

    // Rotate individual page (CW)
    const rotatePage = (index: number) => {
        setPages((prev) => {
            const next = [...prev];
            next[index] = {
                ...next[index],
                rotation: (next[index].rotation + 90) % 360
            };
            return next;
        });
    };

    // Bulk rotate all pages
    const rotateAllPages = (deg: number) => {
        setPages((prev) =>
            prev.map((p) => ({
                ...p,
                rotation: (p.rotation + deg + 360) % 360
            }))
        );
    };

    // Reverse page order
    const reversePageOrder = () => {
        setPages((prev) => [...prev].reverse());
    };

    // Duplicate page
    const duplicatePage = (index: number) => {
        setPages((prev) => {
            const next = [...prev];
            const original = next[index];
            const copy: OrganizePageItem = {
                ...original,
                id: `dup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
            };
            next.splice(index + 1, 0, copy);
            return next;
        });
    };

    // Delete page
    const deletePage = (index: number) => {
        if (pages.length <= 1) {
            setErrorMessage("Dokumen harus memiliki minimal 1 halaman aktif.");
            return;
        }

        setPages((prev) => {
            const next = [...prev];
            const [deleted] = next.splice(index, 1);
            setDeletedPages((dPrev) => [...dPrev, deleted]);
            return next;
        });
    };

    // Restore last deleted page
    const restoreLastDeletedPage = () => {
        if (deletedPages.length === 0) return;
        const lastDeleted = deletedPages[deletedPages.length - 1];

        setDeletedPages((prev) => prev.slice(0, prev.length - 1));
        setPages((prev) => [...prev, lastDeleted]);
    };

    // Save and Compile New PDF
    const saveOrganizedPdf = async () => {
        if (!fileBytes || pages.length === 0 || !file) return;

        setIsSaving(true);
        setSaveProgress(10);
        setErrorMessage(null);

        try {
            const origPdfDoc = await PDFDocument.load(fileBytes);
            const newPdfDoc = await PDFDocument.create();

            for (let i = 0; i < pages.length; i++) {
                const item = pages[i];
                setSaveProgress(Math.round(15 + (i / pages.length) * 70));

                const [copiedPage] = await newPdfDoc.copyPages(origPdfDoc, [item.originalIndex]);

                // Apply rotation
                if (item.rotation !== 0) {
                    const currentAngle = copiedPage.getRotation().angle;
                    copiedPage.setRotation(degrees((currentAngle + item.rotation) % 360));
                }

                newPdfDoc.addPage(copiedPage);
            }

            setSaveProgress(90);
            const finalBytes = await newPdfDoc.save();
            const blob = new Blob([finalBytes.buffer as ArrayBuffer], { type: "application/pdf" });

            const baseName = file.name.replace(/\.pdf$/i, "");
            const outName = `${baseName}-organized.pdf`;

            setResultBlob(blob);
            setResultFileName(outName);
            setResultSize(blob.size);

            // Thumbnail for result
            if (pages.length > 0) {
                setResultThumbnailUrl(pages[0].thumbnailUrl);
            }

            setSaveProgress(100);
        } catch (err: unknown) {
            console.error("Gagal menyusun PDF:", err);
            setErrorMessage("Gagal menyusun dokumen PDF. Silakan coba lagi.");
        } finally {
            setIsSaving(false);
        }
    };

    // Download PDF
    const handleDownload = () => {
        if (!resultBlob) return;
        const url = URL.createObjectURL(resultBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = resultFileName || "dokumen-organized.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    // Reset All State
    const handleReset = () => {
        setFile(null);
        setFileBytes(null);
        setPages([]);
        setDeletedPages([]);
        setResultBlob(null);
        setResultThumbnailUrl(null);
        setErrorMessage(null);
        setIsSaving(false);
    };

    return (
        <div className="space-y-8">
            {/* Error Banner */}
            {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
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
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
                            <FileStack className="w-7 h-7" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                            Pilih Dokumen PDF yang Ingin Dikelola
                        </h2>
                        <p className="text-foreground/60 text-sm">
                            Atur ulang urutan halaman (drag & drop), hapus halaman yang salah, putar halaman, atau duplikat halaman dalam satu tampilan visual.
                        </p>
                    </div>

                    <Dropzone
                        onFilesAccepted={handleFileAccepted}
                        accept=".pdf,application/pdf"
                        title="Tarik & Lepas File PDF ke Sini"
                        description="Mendukung dokumen multi-halaman. Berkas diproses 100% lokal tanpa unggah server."
                    />

                    {/* Features highlight */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div className="p-4 rounded-2xl bg-surface/50 border border-border/50 text-center space-y-1">
                            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                                Drag & Drop Mudah
                            </span>
                            <p className="text-xs text-foreground/60">
                                Geser posisi kartu halaman secara visual untuk memindahkan urutan dokumen.
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-surface/50 border border-border/50 text-center space-y-1">
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                                Hapus & Putar Selektif
                            </span>
                            <p className="text-xs text-foreground/60">
                                Buang halaman kosong/salah atau perbaiki orientasi halaman terbalik.
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-surface/50 border border-border/50 text-center space-y-1">
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                100% Privasi Mutlak
                            </span>
                            <p className="text-xs text-foreground/60">
                                Berkas diproses menggunakan memori browser lokal tanpa pernah keluar ke cloud.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
                <div className="glass-panel p-12 rounded-3xl border border-border/80 text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-purple-500 mx-auto" />
                    <h3 className="text-lg font-bold text-foreground">Memuat Halaman PDF...</h3>
                    <p className="text-xs text-foreground/60">{loadingProgress}</p>
                </div>
            )}

            {/* Step 2: Interactive Page Grid Editor */}
            {file && !isLoading && !resultBlob && (
                <div className="space-y-6">
                    {/* Top Toolbar */}
                    <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-border/80 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground text-sm sm:text-base truncate max-w-44 sm:max-w-xs" title={file.name}>
                                    {file.name}
                                </h3>
                                <p className="text-xs text-foreground/50">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB • {pages.length} Halaman Aktif
                                    {deletedPages.length > 0 && ` (${deletedPages.length} Dihapus)`}
                                </p>
                            </div>
                        </div>

                        {/* Global Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Undo deleted page */}
                            {deletedPages.length > 0 && (
                                <button
                                    onClick={restoreLastDeletedPage}
                                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                                    title="Pulihkan halaman yang baru dihapus"
                                >
                                    <Undo2 className="w-3.5 h-3.5" />
                                    <span>Pulihkan ({deletedPages.length})</span>
                                </button>
                            )}

                            {/* Rotate all CW */}
                            <button
                                onClick={() => rotateAllPages(90)}
                                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-surface/80 hover:bg-surface border border-border/60 text-foreground/80 hover:text-foreground transition-colors flex items-center gap-1.5 cursor-pointer"
                                title="Putar semua halaman 90° searah jarum jam"
                            >
                                <RotateCw className="w-3.5 h-3.5" />
                                <span>Putar Semua +90°</span>
                            </button>

                            {/* Reverse page order */}
                            <button
                                onClick={reversePageOrder}
                                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-surface/80 hover:bg-surface border border-border/60 text-foreground/80 hover:text-foreground transition-colors flex items-center gap-1.5 cursor-pointer"
                                title="Balik urutan seluruh halaman (dari belakang ke depan)"
                            >
                                <ArrowUpDown className="w-3.5 h-3.5" />
                                <span>Balik Urutan</span>
                            </button>

                            <button
                                onClick={handleReset}
                                className="px-3 py-1.5 rounded-xl text-xs font-medium text-foreground/60 hover:text-foreground hover:bg-surface border border-border/60 transition-colors flex items-center gap-1.5 cursor-pointer ml-1"
                            >
                                <ResetIcon className="w-3.5 h-3.5" />
                                <span>Ganti File</span>
                            </button>
                        </div>
                    </div>

                    {/* Drag Hint Banner */}
                    <div className="px-4 py-2.5 rounded-2xl bg-surface/60 border border-border/60 text-xs text-foreground/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-purple-400" />
                            <span>
                                Tarik & lepas kartu halaman untuk mengubah urutan, atau gunakan tombol panah kiri/kanan pada tiap halaman.
                            </span>
                        </div>
                        <span className="font-mono text-purple-400 text-[11px] font-semibold">
                            Total: {pages.length} Halaman
                        </span>
                    </div>

                    {/* Page Grid Container */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {pages.map((item, index) => {
                            const isBeingDragged = draggedIndex === index;
                            const isOver = dragOverIndex === index;

                            return (
                                <div
                                    key={item.id}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDrop={() => handleDrop(index)}
                                    onDragEnd={handleDragEnd}
                                    className={`group relative glass-panel rounded-2xl border p-2.5 transition-all flex flex-col justify-between cursor-grab active:cursor-grabbing ${
                                        isBeingDragged
                                            ? "opacity-30 scale-95 border-purple-500"
                                            : isOver
                                            ? "border-purple-400 scale-105 shadow-xl bg-purple-500/10"
                                            : "border-border/70 hover:border-purple-500/40 hover:shadow-lg"
                                    }`}
                                >
                                    {/* Card Header (Order Badge & Quick Actions) */}
                                    <div className="flex items-center justify-between gap-1 mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-6 h-6 rounded-lg bg-purple-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                                                {index + 1}
                                            </span>
                                            {item.displayNumber !== index + 1 && (
                                                <span className="text-[10px] text-foreground/40 font-mono">
                                                    (Asli: {item.displayNumber})
                                                </span>
                                            )}
                                        </div>

                                        {/* Lightbox Zoom Icon */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setLightboxItem({
                                                    url: item.thumbnailUrl,
                                                    title: `Halaman ${index + 1} (Asli Hal ${item.displayNumber})`,
                                                    pageNumber: index + 1,
                                                    totalPages: pages.length
                                                });
                                            }}
                                            className="p-1 rounded-md text-foreground/40 hover:text-purple-400 hover:bg-surface transition-colors cursor-pointer"
                                            title="Perbesar Pratinjau Halaman"
                                        >
                                            <ZoomIn className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Thumbnail Preview Image with Rotation */}
                                    <div className="relative aspect-3/4 rounded-xl overflow-hidden bg-black/30 border border-border/50 flex items-center justify-center p-1 my-1">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={item.thumbnailUrl}
                                            alt={`Pratinjau Halaman ${index + 1}`}
                                            style={{
                                                transform: `rotate(${item.rotation}deg)`,
                                                transition: "transform 0.15s ease-out"
                                            }}
                                            className="max-h-full max-w-full object-contain pointer-events-none rounded-sm shadow-xs"
                                            draggable={false}
                                        />

                                        {item.rotation !== 0 && (
                                            <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-xs bg-black/80 text-[9px] font-mono text-purple-300 border border-purple-500/30">
                                                {item.rotation}°
                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom Control Actions */}
                                    <div className="grid grid-cols-4 gap-1 mt-2 pt-2 border-t border-border/40">
                                        {/* Move Left */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                movePage(index, "left");
                                            }}
                                            disabled={index === 0}
                                            className="p-1.5 rounded-lg bg-surface/60 hover:bg-surface disabled:opacity-20 text-foreground/70 hover:text-foreground flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed"
                                            title="Geser ke kiri / maju"
                                        >
                                            <MoveLeft className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Rotate CW */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                rotatePage(index);
                                            }}
                                            className="p-1.5 rounded-lg bg-surface/60 hover:bg-purple-500/20 text-foreground/70 hover:text-purple-300 flex items-center justify-center transition-colors cursor-pointer"
                                            title="Putar 90° searah jarum jam"
                                        >
                                            <RotateCw className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Duplicate Page */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                duplicatePage(index);
                                            }}
                                            className="p-1.5 rounded-lg bg-surface/60 hover:bg-surface text-foreground/70 hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                                            title="Duplikat / salin halaman ini"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Delete Page */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deletePage(index);
                                            }}
                                            className="p-1.5 rounded-lg bg-surface/60 hover:bg-rose-500/20 text-foreground/70 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                                            title="Hapus halaman ini"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom Save Action Bar */}
                    <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="space-y-1 text-center sm:text-left">
                            <div className="flex items-center gap-2 justify-center sm:justify-start">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    <FileStack className="w-3.5 h-3.5" />
                                    {pages.length} Halaman Siap Disimpan
                                </span>
                                {deletedPages.length > 0 && (
                                    <span className="text-xs text-foreground/50">
                                        ({deletedPages.length} halaman dibuang)
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-foreground/60">
                                Dokumen baru akan dirakit sesuai urutan dan orientasi yang Anda tetapkan.
                            </p>
                        </div>

                        <button
                            onClick={saveOrganizedPdf}
                            disabled={pages.length === 0 || isSaving}
                            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Menyusun Dokumen ({saveProgress}%)...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    <span>Simpan & Unduh PDF Baru</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Success & Download State */}
            {resultBlob && (
                <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-border/80 space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-border/60">
                        <div className="flex items-center gap-4 text-center sm:text-left">
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mx-auto sm:mx-0">
                                <CheckCircle2 className="w-7 h-7" />
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold mb-1">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    PDF Berhasil Dikelola!
                                </div>
                                <h3 className="text-xl font-bold text-foreground truncate max-w-sm sm:max-w-md">
                                    {resultFileName}
                                </h3>
                                <p className="text-xs text-foreground/60 mt-0.5">
                                    Total: {pages.length} Halaman • Ukuran: {(resultSize / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={handleDownload}
                                className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl font-bold text-sm bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Download className="w-4 h-4" />
                                <span>Unduh PDF Baru</span>
                            </button>
                            <button
                                onClick={() => setResultBlob(null)}
                                className="px-4 py-3 rounded-2xl bg-surface hover:bg-surface/80 border border-border/60 text-xs font-semibold text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
                            >
                                Atur Lagi
                            </button>
                            <button
                                onClick={handleReset}
                                className="p-3 rounded-2xl bg-surface hover:bg-surface/80 border border-border/60 text-foreground/70 hover:text-foreground transition-colors"
                                title="Kelola Dokumen Lain"
                            >
                                <ResetIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Embedded Viewer & Preview */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Eye className="w-4 h-4 text-purple-400" />
                                Pratinjau Hasil Akhir Dokumen
                            </h4>
                            {resultThumbnailUrl && (
                                <button
                                    onClick={() =>
                                        setLightboxItem({
                                            url: resultThumbnailUrl,
                                            title: `Pratinjau Hasil: ${resultFileName}`,
                                            mimeType: "application/pdf"
                                        })
                                    }
                                    className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
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
                            accentColor="purple"
                            onDownload={handleDownload}
                        />
                    </div>
                </div>
            )}

            {/* Media Lightbox Modal */}
            <MediaLightboxModal
                isOpen={!!lightboxItem}
                item={lightboxItem}
                onClose={() => setLightboxItem(null)}
                accentColor="purple"
            />
        </div>
    );
}
