"use client";

import { useState, useRef, useEffect } from "react";
import Dropzone from "@/components/ui/Dropzone";
import * as pdfjsLib from "pdfjs-dist";
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
    RefreshCw
} from "lucide-react";

// Configure PDF.js worker using jsdelivr matching the installed pdfjs-dist version
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface PageThumbnail {
    pageNumber: number;
    dataUrl: string;
    width: number;
    height: number;
    initialRotation: number;
}

export default function ClientRotatePdf() {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingProgress, setLoadingProgress] = useState<string>("");
    const [pages, setPages] = useState<PageThumbnail[]>([]);
    const [pageRotations, setPageRotations] = useState<number[]>([]);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isSaved, setIsSaved] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileAccepted = async (acceptedFiles: File[]) => {
        const pdfFile = acceptedFiles.find(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
        if (!pdfFile) {
            alert("Silakan pilih berkas dokumen berformat PDF.");
            return;
        }

        setFile(pdfFile);
        setIsLoading(true);
        setPages([]);
        setPageRotations([]);
        setIsSaved(false);
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
                
                // Scale 0.6 is crisp for thumbnails while saving memory
                const viewport = page.getViewport({ scale: 0.6 });
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
                        width: viewport.width,
                        height: viewport.height,
                        initialRotation: page.rotate || 0,
                    });
                } else {
                    loadedThumbnails.push({
                        pageNumber: pageNum,
                        dataUrl: "",
                        width: 200,
                        height: 280,
                        initialRotation: page.rotate || 0,
                    });
                }

                initialRotations.push(0);
            }

            setPages(loadedThumbnails);
            setPageRotations(initialRotations);
        } catch (error) {
            console.error("Error loading PDF pages:", error);
            alert("Gagal memuat pratinjau PDF. Pastikan dokumen tidak rusak atau diproteksi kata sandi.");
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
        setIsLoading(false);
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
    };

    const rotateAllPages = (delta: number) => {
        setPageRotations(prev =>
            prev.map(angle => ((angle + delta) % 360 + 360) % 360)
        );
        setIsSaved(false);
    };

    const resetAllRotations = () => {
        setPageRotations(pages.map(() => 0));
        setIsSaved(false);
    };

    const saveRotatedPdf = async () => {
        if (!file || pages.length === 0) return;
        setIsSaving(true);

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

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const nameParts = file.name.split(".");
            const ext = nameParts.pop();
            const baseName = nameParts.join(".");
            a.download = `${baseName}-terputar.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setIsSaved(true);
        } catch (error) {
            console.error("Failed to save rotated PDF:", error);
            alert("Gagal menyimpan dokumen PDF yang diputar. Silakan coba kembali.");
        } finally {
            setIsSaving(false);
        }
    };

    const hasAnyRotation = pageRotations.some(angle => angle !== 0);

    return (
        <div className="space-y-8 w-full">
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

            {!file ? (
                <div className="animate-fade-in">
                    <Dropzone
                        onFilesAccepted={handleFileAccepted}
                        accept="application/pdf"
                        title="Tarik & Letakkan File PDF di Sini"
                        description="Mendukung dokumen PDF satu atau multi-halaman. Halaman akan diputar secara lossless tanpa mengurangi ketajaman teks/gambar."
                        icons={
                            <div className="flex items-center gap-2 text-rose-500 font-semibold text-sm">
                                <FileText className="w-5 h-5" />
                                <span>Dokumen PDF (Semua Ukuran)</span>
                            </div>
                        }
                    />
                </div>
            ) : isLoading ? (
                <div className="glass-panel p-12 rounded-3xl border border-border/80 text-center space-y-4 shadow-xl">
                    <Loader2 className="w-10 h-10 animate-spin text-rose-500 mx-auto" />
                    <h3 className="text-lg font-bold text-foreground">Menyiapkan Pratinjau Halaman...</h3>
                    <p className="text-sm text-foreground/60">{loadingProgress || "Memproses halaman di peramban Anda..."}</p>
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    {/* Top Action & Batch Toolbar */}
                    <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-border/80 shadow-xl space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-base sm:text-lg text-foreground truncate">
                                        {file.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-foreground/60 mt-0.5">
                                        <span>{pages.length} Halaman</span>
                                        <span>•</span>
                                        <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                        <span>•</span>
                                        <span className="text-emerald-400 font-medium">Lossless Rotation</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-foreground/80 hover:text-foreground bg-surface hover:bg-surface/80 border border-border/70 rounded-xl transition-all active:scale-95"
                                >
                                    <FolderOpen className="w-4 h-4 text-rose-500" />
                                    <span>Ganti PDF</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-foreground/70 hover:text-rose-400 bg-surface hover:bg-rose-500/10 border border-border/70 hover:border-rose-500/30 rounded-xl transition-all active:scale-95"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    <span>Clear</span>
                                </button>
                            </div>
                        </div>

                        {/* Batch Action Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider mr-1">
                                    Putar Serentak:
                                </span>
                                <button
                                    type="button"
                                    onClick={() => rotateAllPages(-90)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-surface hover:bg-surface/80 border border-border/70 hover:border-rose-500/40 text-foreground/80 transition-all active:scale-95"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Semua Kiri (-90°)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => rotateAllPages(90)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-surface hover:bg-surface/80 border border-border/70 hover:border-rose-500/40 text-foreground/80 transition-all active:scale-95"
                                >
                                    <RotateCw className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Semua Kanan (+90°)</span>
                                </button>
                                {hasAnyRotation && (
                                    <button
                                        type="button"
                                        onClick={resetAllRotations}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-foreground/50 hover:text-foreground transition-colors"
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
                                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all ${isSaving
                                    ? "bg-rose-500/50 cursor-not-allowed"
                                    : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 hover:scale-[1.02] active:scale-95 cursor-pointer"
                                    }`}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Menyimpan PDF...</span>
                                    </>
                                ) : isSaved ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span>Unduh Ulang PDF</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        <span>Simpan & Unduh PDF</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Interactive Grid of Pages */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {pages.map((p, idx) => {
                            const rotation = pageRotations[idx] || 0;
                            const isRotated = rotation !== 0;

                            return (
                                <div
                                    key={p.pageNumber}
                                    className={`group flex flex-col p-3 rounded-2xl border transition-all ${isRotated
                                        ? "bg-surface/80 border-rose-500/50 shadow-md ring-1 ring-rose-500/20"
                                        : "bg-surface/40 border-border/60 hover:border-border hover:bg-surface/60"
                                        }`}
                                >
                                    {/* Page Number & Angle Badge */}
                                    <div className="flex items-center justify-between text-xs mb-2.5 px-1">
                                        <span className="font-bold text-foreground/80">
                                            Hal. {p.pageNumber}
                                        </span>
                                        {isRotated ? (
                                            <span className="px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-400 font-bold text-[10px]">
                                                +{rotation}°
                                            </span>
                                        ) : (
                                            <span className="text-foreground/40 text-[10px]">0°</span>
                                        )}
                                    </div>

                                    {/* Thumbnail Preview with Real-time CSS Rotation */}
                                    <div className="relative aspect-3/4 w-full flex items-center justify-center bg-black/30 rounded-xl overflow-hidden p-2 border border-border/40">
                                        {p.dataUrl ? (
                                            <img
                                                src={p.dataUrl}
                                                alt={`Halaman ${p.pageNumber}`}
                                                className="max-w-full max-h-full object-contain rounded shadow transition-transform duration-300 ease-out"
                                                style={{
                                                    transform: `rotate(${rotation}deg)`,
                                                }}
                                            />
                                        ) : (
                                            <FileText className="w-10 h-10 text-foreground/30" />
                                        )}
                                    </div>

                                    {/* Action Buttons under each page */}
                                    <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2 border-t border-border/40">
                                        <button
                                            type="button"
                                            onClick={() => rotateSinglePage(idx, -90)}
                                            className="inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-surface hover:bg-rose-500/10 text-foreground/70 hover:text-rose-400 border border-border/50 text-xs transition-colors"
                                            title="Putar Kiri (-90°)"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-semibold">-90°</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => rotateSinglePage(idx, 90)}
                                            className="inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-surface hover:bg-rose-500/10 text-foreground/70 hover:text-rose-400 border border-border/50 text-xs transition-colors"
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

                    {/* Bottom Save Bar for Long Documents */}
                    {pages.length > 5 && (
                        <div className="p-4 rounded-2xl bg-surface/60 border border-border/60 flex items-center justify-between gap-4">
                            <span className="text-xs text-foreground/60">
                                Total {pages.length} halaman siap disimpan.
                            </span>
                            <button
                                type="button"
                                onClick={saveRotatedPdf}
                                disabled={isSaving}
                                className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                            >
                                <Download className="w-4 h-4" />
                                <span>Simpan & Unduh PDF</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
