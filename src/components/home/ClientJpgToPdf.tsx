"use client";

import { useState } from "react";
import Dropzone from "@/components/ui/Dropzone";
import { PDFDocument } from "pdf-lib";
import { 
    Settings2, 
    Trash2, 
    ChevronLeft, 
    ChevronRight, 
    FileText, 
    CheckCircle2, 
    Sparkles, 
    RefreshCw,
    Download,
    Maximize2,
    Compass
} from "lucide-react";

type PageSizeOption = "a4" | "letter" | "fit";
type OrientationOption = "auto" | "portrait" | "landscape";
type MarginOption = "none" | "small" | "normal";

const PAGE_DIMENSIONS = {
    a4: { width: 595.28, height: 841.89, label: "A4 (Standar Dokumen)" },
    letter: { width: 612.0, height: 792.0, label: "US Letter" },
    fit: { width: 0, height: 0, label: "Sesuai Ukuran Gambar" },
};

const MARGIN_SIZES = {
    none: { size: 0, label: "Tanpa Margin (Penuh)" },
    small: { size: 20, label: "Margin Rapi (Standar)" },
    normal: { size: 36, label: "Margin Lebar" },
};

export default function ClientJpgToPdf() {
    const [images, setImages] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState<string>("");
    const [completePdf, setCompletePdf] = useState<Blob | null>(null);

    // Settings
    const [pageSize, setPageSize] = useState<PageSizeOption>("a4");
    const [orientation, setOrientation] = useState<OrientationOption>("auto");
    const [margin, setMargin] = useState<MarginOption>("small");

    const handleFiles = (newFiles: File[]) => {
        const imgFiles = newFiles.filter(f => f.type.startsWith("image/"));
        setImages(prev => [...prev, ...imgFiles]);
    };

    const moveImage = (index: number, direction: "left" | "right") => {
        const targetIndex = direction === "left" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= images.length) return;
        setImages(prev => {
            const next = [...prev];
            const temp = next[index];
            next[index] = next[targetIndex];
            next[targetIndex] = temp;
            return next;
        });
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const generatePDF = async () => {
        if (images.length === 0) return;
        setIsProcessing(true);
        setCompletePdf(null);
        setProcessingProgress("Memulai persiapan dokumen...");

        try {
            const pdfDoc = await PDFDocument.create();

            for (let i = 0; i < images.length; i++) {
                const file = images[i];
                setProcessingProgress(`Memproses foto ${i + 1} dari ${images.length}...`);

                let image;
                let imgWidth = 0;
                let imgHeight = 0;

                try {
                    // Normalisasi gambar via createImageBitmap (otomatis membaca EXIF orientation)
                    let bitmap: ImageBitmap;
                    try {
                        bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
                    } catch {
                        bitmap = await createImageBitmap(file);
                    }

                    imgWidth = bitmap.width;
                    imgHeight = bitmap.height;

                    const canvas = document.createElement("canvas");
                    canvas.width = imgWidth;
                    canvas.height = imgHeight;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) continue;
                    ctx.drawImage(bitmap, 0, 0);

                    // Konversi ke JPEG terkompresi berkualitas tinggi (0.92)
                    const blob = await new Promise<Blob | null>((resolve) => {
                        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92);
                    });

                    if (!blob) continue;
                    const arrayBuffer = await blob.arrayBuffer();
                    image = await pdfDoc.embedJpg(arrayBuffer);
                } catch (err) {
                    console.warn(`Pemrosesan canvas gagal untuk ${file.name}, mencoba embedding langsung:`, err);
                    try {
                        const directBytes = await file.arrayBuffer();
                        if (file.type === "image/png") {
                            image = await pdfDoc.embedPng(directBytes);
                        } else {
                            image = await pdfDoc.embedJpg(directBytes);
                        }
                        if (image) {
                            imgWidth = image.width;
                            imgHeight = image.height;
                        }
                    } catch (directErr) {
                        console.error(`Gagal memuat gambar ${file.name}:`, directErr);
                        continue;
                    }
                }

                if (!image || imgWidth <= 0 || imgHeight <= 0) {
                    console.error(`Lewati file ${file.name} karena dimensi tidak valid.`);
                    continue;
                }

                // 1. Tentukan Ukuran Halaman PDF (dalam satuan PDF points: 1 pt = 1/72 inci)
                const marginSize = MARGIN_SIZES[margin].size;
                let pageW: number;
                let pageH: number;

                if (pageSize === "fit") {
                    // Mode ukuran alami: gunakan konversi 150 DPI agar tidak terjadi pembesaran 500%
                    const dpiScale = 72 / 150;
                    const naturalW = imgWidth * dpiScale;
                    const naturalH = imgHeight * dpiScale;
                    pageW = naturalW + (marginSize * 2);
                    pageH = naturalH + (marginSize * 2);
                } else {
                    const base = PAGE_DIMENSIONS[pageSize];
                    const isImgLandscape = imgWidth > imgHeight;

                    let isPageLandscape = false;
                    if (orientation === "auto") {
                        isPageLandscape = isImgLandscape;
                    } else if (orientation === "landscape") {
                        isPageLandscape = true;
                    } else {
                        isPageLandscape = false;
                    }

                    if (isPageLandscape) {
                        pageW = Math.max(base.width, base.height);
                        pageH = Math.min(base.width, base.height);
                    } else {
                        pageW = Math.min(base.width, base.height);
                        pageH = Math.max(base.width, base.height);
                    }
                }

                // 2. Hitung Skala Gambar agar Pas dan Terpusat (Centering)
                const usableW = Math.max(pageW - (marginSize * 2), 10);
                const usableH = Math.max(pageH - (marginSize * 2), 10);

                const scale = Math.min(usableW / imgWidth, usableH / imgHeight);
                const drawW = imgWidth * scale;
                const drawH = imgHeight * scale;

                // Pada pdf-lib, koordinat y=0 adalah sudut bawah halaman
                const x = marginSize + (usableW - drawW) / 2;
                const y = marginSize + (usableH - drawH) / 2;

                const page = pdfDoc.addPage([pageW, pageH]);
                page.drawImage(image, {
                    x,
                    y,
                    width: drawW,
                    height: drawH,
                });
            }

            setProcessingProgress("Menyusun dan merender berkas PDF...");
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
            setCompletePdf(blob);
        } catch (e) {
            console.error("Gagal membuat PDF:", e);
        } finally {
            setIsProcessing(false);
            setProcessingProgress("");
        }
    };

    const handleDownload = () => {
        if (!completePdf) return;
        const url = URL.createObjectURL(completePdf);
        const a = document.createElement("a");
        a.href = url;
        a.download = `datascry-dokumen-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const resetState = () => {
        setImages([]);
        setCompletePdf(null);
        setIsProcessing(false);
        setProcessingProgress("");
    };

    return (
        <div className="space-y-10">
            {!completePdf ? (
                <>
                    <Dropzone
                        onFilesAccepted={handleFiles}
                        accept="image/*"
                        title="Unggah Foto / Gambar"
                        description="Mendukung JPG, PNG, WebP. Format potret dan lanskap akan otomatis disesuaikan ukurannya ke standar dokumen."
                        icons={
                            <div className="flex items-center gap-1.5">
                                <span className="text-amber-500 font-bold">JPG / PNG / WebP</span>
                            </div>
                        }
                    />

                    {images.length > 0 && (
                        <div className="space-y-8">
                            {/* Panel Pengaturan Tata Letak Dokumen */}
                            <div className="glass-panel p-6 rounded-2xl border border-border/80 space-y-6">
                                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                                    <div className="flex items-center gap-2">
                                        <Settings2 className="w-5 h-5 text-amber-500" />
                                        <h3 className="font-bold text-foreground text-base sm:text-lg">
                                            Pengaturan Halaman PDF
                                        </h3>
                                    </div>
                                    <span className="text-xs text-foreground/60 hidden sm:inline">
                                        Mencegah hasil zoom berlebih pada dokumen
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* 1. Ukuran Kertas */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5 text-amber-500" />
                                            Ukuran Kertas
                                        </label>
                                        <select
                                            value={pageSize}
                                            onChange={(e) => setPageSize(e.target.value as PageSizeOption)}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm focus:outline-none focus:border-amber-500 transition-colors"
                                        >
                                            <option value="a4">A4 (Standar Dokumen - 210×297mm)</option>
                                            <option value="letter">US Letter (216×279mm)</option>
                                            <option value="fit">Pas Ukuran Gambar (Proporsional)</option>
                                        </select>
                                    </div>

                                    {/* 2. Orientasi */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                                            <Compass className="w-3.5 h-3.5 text-amber-500" />
                                            Orientasi Halaman
                                        </label>
                                        <select
                                            value={orientation}
                                            onChange={(e) => setOrientation(e.target.value as OrientationOption)}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm focus:outline-none focus:border-amber-500 transition-colors"
                                        >
                                            <option value="auto">Otomatis (Sesuai Foto Masing-masing)</option>
                                            <option value="portrait">Paksa Potret (Tegak)</option>
                                            <option value="landscape">Paksa Lanskap (Mendatar)</option>
                                        </select>
                                    </div>

                                    {/* 3. Margin */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                                            <Maximize2 className="w-3.5 h-3.5 text-amber-500" />
                                            Batas Tepi (Margin)
                                        </label>
                                        <select
                                            value={margin}
                                            onChange={(e) => setMargin(e.target.value as MarginOption)}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-foreground text-sm focus:outline-none focus:border-amber-500 transition-colors"
                                        >
                                            <option value="small">Margin Rapi (~7mm, Bagus Dicetak)</option>
                                            <option value="none">Tanpa Margin (Gambar Penuh Halaman)</option>
                                            <option value="normal">Margin Lebar (~13mm)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Header List Gambar & Tombol Proses */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                        Foto Terpilih ({images.length})
                                    </h2>
                                    <p className="text-xs text-foreground/60 mt-0.5">
                                        Gunakan tombol panah untuk mengatur urutan halaman di PDF Anda.
                                    </p>
                                </div>

                                <button
                                    onClick={generatePDF}
                                    disabled={isProcessing}
                                    className={`px-8 py-3 rounded-full font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
                                        isProcessing 
                                            ? "bg-amber-500/50 cursor-not-allowed" 
                                            : "bg-amber-500 hover:bg-amber-600 hover:scale-105 active:scale-95 shadow-amber-500/20"
                                    }`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Memproses...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            <span>Konversi ke PDF</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Progress bar info jika sedang proses */}
                            {isProcessing && processingProgress && (
                                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium flex items-center gap-2 animate-pulse">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>{processingProgress}</span>
                                </div>
                            )}

                            {/* Grid Pratinjau & Manajemen Urutan */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {images.map((img, idx) => (
                                    <div
                                        key={`${img.name}-${idx}`}
                                        className="relative aspect-3/4 rounded-2xl overflow-hidden glass-panel border border-border/80 group flex flex-col bg-surface/50 shadow-sm"
                                    >
                                        {/* Label Nomor Halaman */}
                                        <div className="absolute top-2.5 left-2.5 z-10 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md text-white text-[11px] font-bold border border-white/10">
                                            Hal {idx + 1}
                                        </div>

                                        {/* Tombol Hapus */}
                                        <button
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-2.5 right-2.5 z-10 p-1.5 bg-rose-500/90 hover:bg-rose-600 text-white rounded-lg transition-transform hover:scale-110 shadow-sm"
                                            title="Hapus foto ini"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Preview Gambar */}
                                        <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black/40">
                                            <img
                                                src={URL.createObjectURL(img)}
                                                alt={img.name}
                                                className="w-full h-full object-contain p-2"
                                            />
                                        </div>

                                        {/* Bar Kontrol Bawah (Nama File & Urutan) */}
                                        <div className="p-2.5 bg-surface/90 border-t border-border/50 flex items-center justify-between gap-1">
                                            <p className="text-foreground/80 text-xs truncate flex-1 font-medium" title={img.name}>
                                                {img.name}
                                            </p>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => moveImage(idx, "left")}
                                                    disabled={idx === 0}
                                                    className="p-1 rounded bg-surface hover:bg-surface/80 border border-border/70 text-foreground/70 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                                    title="Pindah ke halaman sebelumnya"
                                                >
                                                    <ChevronLeft className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => moveImage(idx, "right")}
                                                    disabled={idx === images.length - 1}
                                                    className="p-1 rounded bg-surface hover:bg-surface/80 border border-border/70 text-foreground/70 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                                    title="Pindah ke halaman berikutnya"
                                                >
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* Sukses & Download State */
                <div className="p-8 sm:p-12 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-6 max-w-2xl mx-auto mt-6 glass-panel">
                    <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-2 shadow-inner">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    
                    <div className="space-y-2">
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                            PDF Siap Diunduh!
                        </h3>
                        <p className="text-foreground/70 text-base max-w-md mx-auto">
                            Semua gambar berhasil diselaraskan ke ukuran standar dokumen (A4) yang rapi, proporsional, dan tidak lagi ngezoom raksasa.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <button
                            onClick={handleDownload}
                            className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 w-full sm:w-auto flex items-center justify-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            <span>Unduh PDF ({(completePdf.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </button>
                        
                        <button
                            onClick={resetState}
                            className="px-8 py-4 rounded-2xl bg-surface hover:bg-surface/80 text-foreground font-bold transition-all border border-border hover:scale-105 active:scale-95 w-full sm:w-auto flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Konversi Lagi</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
