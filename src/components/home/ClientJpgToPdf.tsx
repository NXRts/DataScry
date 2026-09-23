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
    Compass,
    Monitor,
    Layers,
    Info,
    Check
} from "lucide-react";

type PageMode = "fit" | "document";
type PageSizeOption = "fit" | "a4" | "letter";
type OrientationOption = "auto" | "portrait" | "landscape";
type MarginOption = "none" | "small" | "normal";
type ImageFitOption = "contain" | "cover";

interface ImageMeta {
    file: File;
    width: number;
    height: number;
    aspectRatio: number;
    previewUrl: string;
}

const PAGE_DIMENSIONS = {
    a4: { width: 595.28, height: 841.89, label: "A4 (Standar Dokumen - 210×297mm)" },
    letter: { width: 612.0, height: 792.0, label: "US Letter (216×279mm)" },
    fit: { width: 0, height: 0, label: "Sesuai Ukuran Gambar (Otomatis)" },
};

const MARGIN_SIZES = {
    none: { size: 0, label: "Tanpa Margin (Penuh / 0 mm)" },
    small: { size: 15, label: "Margin Rapi (5 mm)" },
    normal: { size: 30, label: "Margin Lebar (10 mm)" },
};

export default function ClientJpgToPdf() {
    const [images, setImages] = useState<ImageMeta[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState<string>("");
    const [completePdf, setCompletePdf] = useState<Blob | null>(null);

    // Primary Layout Mode
    // "fit" = Seamless borderless matching exact image dimensions (ideal for desktop screenshots & photos)
    // "document" = Fixed paper size like A4/Letter (for printing & official documents)
    const [pageMode, setPageMode] = useState<PageMode>("fit");

    // Detailed Settings
    const [pageSize, setPageSize] = useState<PageSizeOption>("fit");
    const [orientation, setOrientation] = useState<OrientationOption>("auto");
    const [margin, setMargin] = useState<MarginOption>("none");
    const [imageFit, setImageFit] = useState<ImageFitOption>("contain");

    // Notification banner
    const [autoDetectNotice, setAutoDetectNotice] = useState<string | null>(null);

    const handleFiles = async (newFiles: File[]) => {
        const imgFiles = newFiles.filter(f => f.type.startsWith("image/"));
        if (imgFiles.length === 0) return;

        // Load image dimensions to assist auto-detection
        const loadedMetas: ImageMeta[] = [];
        let hasScreenshot = false;

        for (const file of imgFiles) {
            const previewUrl = URL.createObjectURL(file);
            const dims = await new Promise<{ width: number; height: number }>((resolve) => {
                const img = new Image();
                img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
                img.onerror = () => resolve({ width: 0, height: 0 });
                img.src = previewUrl;
            });

            const ratio = dims.height > 0 ? dims.width / dims.height : 1;
            loadedMetas.push({
                file,
                width: dims.width,
                height: dims.height,
                aspectRatio: ratio,
                previewUrl,
            });

            // Detect desktop screenshots or wide landscape images (16:9 is 1.77, 16:10 is 1.6, ultrawide >= 2.0)
            if (
                ratio >= 1.35 || 
                /screen|capture|cuplikan|tangkapan/i.test(file.name)
            ) {
                hasScreenshot = true;
            }
        }

        setImages(prev => [...prev, ...loadedMetas]);

        // Auto-switch to "fit" (Borderless) if screenshot or landscape image is detected
        if (hasScreenshot) {
            setPageMode("fit");
            setPageSize("fit");
            setMargin("none");
            setOrientation("auto");
            setAutoDetectNotice(
                "💡 Terdeteksi tangkapan layar (screenshot): Mode 'Pas Ukuran Asli Gambar (Tanpa Border)' dipilih otomatis agar gambar tidak mengecil dan bebas dari border putih."
            );
        }
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
        setImages(prev => {
            const target = prev[index];
            if (target?.previewUrl) {
                URL.revokeObjectURL(target.previewUrl);
            }
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSwitchMode = (mode: PageMode) => {
        setPageMode(mode);
        if (mode === "fit") {
            setPageSize("fit");
            setMargin("none");
            setOrientation("auto");
        } else {
            setPageSize("a4");
            setMargin("small");
            setOrientation("auto");
            setImageFit("contain");
        }
    };

    const generatePDF = async () => {
        if (images.length === 0) return;
        setIsProcessing(true);
        setCompletePdf(null);
        setProcessingProgress("Memulai persiapan dokumen PDF...");

        try {
            const pdfDoc = await PDFDocument.create();

            for (let i = 0; i < images.length; i++) {
                const item = images[i];
                const file = item.file;
                setProcessingProgress(`Memproses foto ${i + 1} dari ${images.length}...`);

                let image;
                let imgWidth = item.width;
                let imgHeight = item.height;

                try {
                    // Normalisasi gambar via createImageBitmap (otomatis membaca orientasi EXIF kamera)
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

                    // Untuk berkas PNG (screenshot teks/kode), simpan sebagai PNG murni agar bebas dari blur kompresi JPEG
                    const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
                    const mimeType = isPng ? "image/png" : "image/jpeg";
                    const quality = isPng ? undefined : 0.95;

                    const blob = await new Promise<Blob | null>((resolve) => {
                        canvas.toBlob((b) => resolve(b), mimeType, quality);
                    });

                    if (!blob) continue;
                    const arrayBuffer = await blob.arrayBuffer();

                    if (isPng) {
                        image = await pdfDoc.embedPng(arrayBuffer);
                    } else {
                        image = await pdfDoc.embedJpg(arrayBuffer);
                    }
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
                let drawW: number;
                let drawH: number;
                let x: number;
                let y: number;

                if (pageMode === "fit" || pageSize === "fit") {
                    // MODE PAS UKURAN ASLI (BORDERLESS)
                    // Gunakan skala layar 96 DPI standar (1 px = 0.75 pt) sehingga 1920x1080 -> 1440x810 pt
                    const dpiScale = 72 / 96;
                    const naturalW = imgWidth * dpiScale;
                    const naturalH = imgHeight * dpiScale;

                    pageW = naturalW + (marginSize * 2);
                    pageH = naturalH + (marginSize * 2);

                    drawW = naturalW;
                    drawH = naturalH;
                    x = marginSize;
                    y = marginSize;
                } else {
                    // MODE STANDAR DOKUMEN (A4 / Letter)
                    const base = PAGE_DIMENSIONS[pageSize as "a4" | "letter"] || PAGE_DIMENSIONS.a4;
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

                    const usableW = Math.max(pageW - (marginSize * 2), 10);
                    const usableH = Math.max(pageH - (marginSize * 2), 10);

                    if (imageFit === "cover") {
                        // Penuhi Halaman (Fill / Crop tepi tanpa border putih sama sekali)
                        const scale = Math.max(usableW / imgWidth, usableH / imgHeight);
                        drawW = imgWidth * scale;
                        drawH = imgHeight * scale;
                    } else {
                        // Paskan Gambar (Contain / Letterbox utuh)
                        const scale = Math.min(usableW / imgWidth, usableH / imgHeight);
                        drawW = imgWidth * scale;
                        drawH = imgHeight * scale;
                    }

                    x = marginSize + (usableW - drawW) / 2;
                    y = marginSize + (usableH - drawH) / 2;
                }

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
        images.forEach(item => {
            if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        });
        setImages([]);
        setCompletePdf(null);
        setIsProcessing(false);
        setProcessingProgress("");
        setAutoDetectNotice(null);
    };

    const formatRatio = (r: number) => {
        if (Math.abs(r - 16 / 9) < 0.05) return "16:9 (Layar Lebar)";
        if (Math.abs(r - 16 / 10) < 0.05) return "16:10 (Monitor)";
        if (Math.abs(r - 4 / 3) < 0.05) return "4:3 (Foto Standar)";
        if (Math.abs(r - 1) < 0.05) return "1:1 (Persegi)";
        if (Math.abs(r - 9 / 16) < 0.05) return "9:16 (Layar HP)";
        return r > 1 ? `${r.toFixed(2)}:1 (Lanskap)` : `1:${(1 / r).toFixed(2)} (Potret)`;
    };

    return (
        <div className="space-y-10">
            {!completePdf ? (
                <>
                    <Dropzone
                        onFilesAccepted={handleFiles}
                        accept="image/*"
                        title="Unggah Foto atau Tangkapan Layar (Screenshot)"
                        description="Mendukung JPG, PNG, WebP. Screenshot desktop dan foto akan otomatis disesuaikan secara proporsional tanpa border putih."
                        icons={
                            <div className="flex items-center gap-1.5">
                                <span className="text-amber-500 font-bold">JPG / PNG / WebP</span>
                            </div>
                        }
                    />

                    {images.length > 0 && (
                        <div className="space-y-8 animate-fade-in">
                            {/* Auto Detect Notice Banner */}
                            {autoDetectNotice && (
                                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm flex items-start gap-3 shadow-lg">
                                    <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                                    <div className="flex-1 font-medium">{autoDetectNotice}</div>
                                </div>
                            )}

                            {/* Panel Pengaturan Tata Letak Dokumen */}
                            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-border/80 space-y-6 shadow-xl">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-4">
                                    <div className="flex items-center gap-2">
                                        <Settings2 className="w-5 h-5 text-amber-500" />
                                        <h3 className="font-bold text-foreground text-base sm:text-lg">
                                            Format & Ukuran Halaman PDF
                                        </h3>
                                    </div>
                                    <span className="text-xs text-foreground/60">
                                        Pilih bagaimana gambar disesuaikan pada halaman PDF
                                    </span>
                                </div>

                                {/* Mode Pilihan Cepat: Pas Ukuran Asli vs Kertas Dokumen */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => handleSwitchMode("fit")}
                                        className={`p-4 sm:p-5 rounded-2xl border text-left transition-all relative ${
                                            pageMode === "fit"
                                                ? "bg-amber-500/10 border-amber-500/60 shadow-lg text-foreground ring-1 ring-amber-500/30"
                                                : "bg-surface/50 border-border/60 hover:bg-surface text-foreground/70"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2.5">
                                                <Monitor className={`w-5 h-5 ${pageMode === "fit" ? "text-amber-500" : "text-foreground/50"}`} />
                                                <span className="font-bold text-sm sm:text-base">
                                                    Pas Ukuran Asli Gambar (Borderless)
                                                </span>
                                            </div>
                                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                                                Rekomendasi Screenshot
                                            </span>
                                        </div>
                                        <p className="text-xs text-foreground/60 leading-relaxed">
                                            Ukuran halaman PDF persis 1:1 mengikuti gambar Anda. <strong>Tanpa border putih sama sekali</strong>, gambar tampil maksimal dan tajam di layar penuh.
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleSwitchMode("document")}
                                        className={`p-4 sm:p-5 rounded-2xl border text-left transition-all ${
                                            pageMode === "document"
                                                ? "bg-amber-500/10 border-amber-500/60 shadow-lg text-foreground ring-1 ring-amber-500/30"
                                                : "bg-surface/50 border-border/60 hover:bg-surface text-foreground/70"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2.5">
                                                <Layers className={`w-5 h-5 ${pageMode === "document" ? "text-amber-500" : "text-foreground/50"}`} />
                                                <span className="font-bold text-sm sm:text-base">
                                                    Kertas Standar Dokumen (A4 / Cetak)
                                                </span>
                                            </div>
                                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface border border-border/70 text-foreground/50 font-medium">
                                                Siap Print
                                            </span>
                                        </div>
                                        <p className="text-xs text-foreground/60 leading-relaxed">
                                            Menempatkan gambar pada ukuran kertas dokumen standar (A4 / Letter) untuk keperluan arsip administrasi atau dicetak ke printer fisik.
                                        </p>
                                    </button>
                                </div>

                                {/* Opsi Detail jika Mode Kertas Dokumen Dipilih */}
                                {pageMode === "document" && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-surface/60 border border-border/60 animate-fade-in">
                                        {/* 1. Ukuran Kertas */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5 text-amber-500" />
                                                Ukuran Kertas
                                            </label>
                                            <select
                                                value={pageSize}
                                                onChange={(e) => setPageSize(e.target.value as PageSizeOption)}
                                                className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-foreground text-xs focus:outline-none focus:border-amber-500 transition-colors"
                                            >
                                                <option value="a4">A4 (210 × 297 mm)</option>
                                                <option value="letter">US Letter (216 × 279 mm)</option>
                                            </select>
                                        </div>

                                        {/* 2. Orientasi */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                                                <Compass className="w-3.5 h-3.5 text-amber-500" />
                                                Orientasi Halaman
                                            </label>
                                            <select
                                                value={orientation}
                                                onChange={(e) => setOrientation(e.target.value as OrientationOption)}
                                                className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-foreground text-xs focus:outline-none focus:border-amber-500 transition-colors"
                                            >
                                                <option value="auto">Otomatis Sesuai Foto</option>
                                                <option value="landscape">Paksa Lanskap (Mendatar)</option>
                                                <option value="portrait">Paksa Potret (Tegak)</option>
                                            </select>
                                        </div>

                                        {/* 3. Gaya Penyesuaian Gambar */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                                                <Maximize2 className="w-3.5 h-3.5 text-amber-500" />
                                                Penataan Gambar
                                            </label>
                                            <select
                                                value={imageFit}
                                                onChange={(e) => setImageFit(e.target.value as ImageFitOption)}
                                                className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-foreground text-xs focus:outline-none focus:border-amber-500 transition-colors"
                                            >
                                                <option value="contain">Paskan Gambar (Utuh)</option>
                                                <option value="cover">Penuhi Kertas (Tanpa Border)</option>
                                            </select>
                                        </div>

                                        {/* 4. Margin */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                                                <Maximize2 className="w-3.5 h-3.5 text-amber-500" />
                                                Batas Tepi (Margin)
                                            </label>
                                            <select
                                                value={margin}
                                                onChange={(e) => setMargin(e.target.value as MarginOption)}
                                                className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-foreground text-xs focus:outline-none focus:border-amber-500 transition-colors"
                                            >
                                                <option value="none">Tanpa Margin (0 mm)</option>
                                                <option value="small">Margin Rapi (5 mm)</option>
                                                <option value="normal">Margin Lebar (10 mm)</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Header List Gambar & Tombol Proses */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                        Foto Terpilih ({images.length})
                                    </h2>
                                    <p className="text-xs text-foreground/60 mt-0.5">
                                        Gunakan tombol panah untuk mengatur urutan halaman pada dokumen PDF Anda.
                                    </p>
                                </div>

                                <button
                                    onClick={generatePDF}
                                    disabled={isProcessing}
                                    className={`px-8 py-3.5 rounded-full font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
                                        isProcessing 
                                            ? "bg-amber-500/50 cursor-not-allowed" 
                                            : "bg-amber-500 hover:bg-amber-600 hover:scale-105 active:scale-95 shadow-amber-500/20"
                                    }`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Memproses PDF...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            <span>Konversi ke PDF Sekarang</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Progress bar info jika sedang proses */}
                            {isProcessing && processingProgress && (
                                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium flex items-center gap-2 animate-pulse">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>{processingProgress}</span>
                                </div>
                            )}

                            {/* Grid Pratinjau & Manajemen Urutan */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {images.map((item, idx) => (
                                    <div
                                        key={`${item.file.name}-${idx}`}
                                        className="relative aspect-3/4 rounded-2xl overflow-hidden glass-panel border border-border/80 group flex flex-col bg-surface/50 shadow-sm"
                                    >
                                        {/* Label Nomor Halaman */}
                                        <div className="absolute top-2.5 left-2.5 z-10 px-2 py-1 rounded-md bg-black/75 backdrop-blur-md text-white text-[11px] font-bold border border-white/10">
                                            Hal {idx + 1}
                                        </div>

                                        {/* Dimensi & Aspek Rasio Tag */}
                                        {item.width > 0 && (
                                            <div className="absolute bottom-12 left-2 z-10 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white/90 text-[10px] font-medium border border-white/10">
                                                {item.width}×{item.height} • {formatRatio(item.aspectRatio)}
                                            </div>
                                        )}

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
                                                src={item.previewUrl}
                                                alt={item.file.name}
                                                className="w-full h-full object-contain p-2"
                                            />
                                        </div>

                                        {/* Bar Kontrol Bawah (Nama File & Urutan) */}
                                        <div className="p-2.5 bg-surface/90 border-t border-border/50 flex items-center justify-between gap-1">
                                            <p className="text-foreground/80 text-xs truncate flex-1 font-medium" title={item.file.name}>
                                                {item.file.name}
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
                <div className="p-8 sm:p-12 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-6 max-w-2xl mx-auto mt-6 glass-panel animate-fade-in shadow-2xl">
                    <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-2 shadow-inner">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    
                    <div className="space-y-2">
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                            PDF Siap Diunduh!
                        </h3>
                        <p className="text-foreground/70 text-base max-w-md mx-auto">
                            {pageMode === "fit" ? (
                                <span>Dokumen PDF Anda telah disesuaikan <strong>100% pas dengan ukuran asli gambar tanpa border putih</strong> yang mengganggu.</span>
                            ) : (
                                <span>Dokumen PDF Anda telah diselaraskan ke ukuran kertas standar <strong>{pageSize.toUpperCase()}</strong> yang rapi dan siap cetak.</span>
                            )}
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
                            <span>Konversi Berkas Lain</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
