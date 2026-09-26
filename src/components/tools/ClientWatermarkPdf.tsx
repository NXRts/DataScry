"use client";

import { useState, useRef, useEffect } from "react";
import Dropzone from "@/components/ui/Dropzone";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import {
    Stamp,
    Download,
    FileText,
    Sparkles,
    CheckCircle2,
    Loader2,
    FolderOpen,
    Check,
    RotateCcw,
    Sliders,
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

type WatermarkColor = "gray" | "red" | "blue" | "green";
type WatermarkAngle = -45 | 0 | 45;
type WatermarkLayout = "center" | "tiled";

export default function ClientWatermarkPdf() {
    const currentYear = new Date().getFullYear();

    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [previewDataUrl, setPreviewDataUrl] = useState<string>("");
    const [pageCount, setPageCount] = useState<number>(0);
    const [previewDimensions, setPreviewDimensions] = useState<{ width: number; height: number }>({ width: 400, height: 560 });

    // Watermark Configuration States
    const [watermarkText, setWatermarkText] = useState<string>(`HANYA UNTUK VERIFIKASI CASN ${currentYear}`);
    const [color, setColor] = useState<WatermarkColor>("red");
    const [opacity, setOpacity] = useState<number>(0.35);
    const [fontSize, setFontSize] = useState<number>(36);
    const [angle, setAngle] = useState<WatermarkAngle>(-45);
    const [layout, setLayout] = useState<WatermarkLayout>("center");

    const [isApplying, setIsApplying] = useState<boolean>(false);
    const [isDownloaded, setIsDownloaded] = useState<boolean>(false);
    const [savedPdfBlob, setSavedPdfBlob] = useState<Blob | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Lightbox Modal
    const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileAccepted = async (acceptedFiles: File[]) => {
        const pdfFile = acceptedFiles.find(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
        if (!pdfFile) {
            setErrorMessage("Silakan pilih berkas dokumen berformat PDF yang valid.");
            return;
        }

        setFile(pdfFile);
        setIsLoading(true);
        setErrorMessage(null);
        setPreviewDataUrl("");
        setSavedPdfBlob(null);
        setIsDownloaded(false);

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
            const pdf = await loadingTask.promise;
            setPageCount(pdf.numPages);

            // Render first page as background preview
            const firstPage = await pdf.getPage(1);
            const viewport = firstPage.getViewport({ scale: 0.8 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            if (context) {
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                setPreviewDimensions({ width: viewport.width, height: viewport.height });

                await firstPage.render({ canvasContext: context, viewport, canvas }).promise;
                setPreviewDataUrl(canvas.toDataURL("image/jpeg", 0.9));
            }
        } catch (error) {
            console.error("Error reading PDF:", error);
            setErrorMessage("Gagal memuat pratinjau dokumen PDF. Pastikan dokumen tidak terkunci.");
            setFile(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        setFile(null);
        setPreviewDataUrl("");
        setPageCount(0);
        setSavedPdfBlob(null);
        setIsDownloaded(false);
        setErrorMessage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Helper: Map WatermarkColor to pdf-lib rgb values
    const getPdfLibColor = (c: WatermarkColor) => {
        switch (c) {
            case "red":
                return rgb(0.88, 0.15, 0.15);
            case "blue":
                return rgb(0.12, 0.35, 0.85);
            case "green":
                return rgb(0.1, 0.65, 0.3);
            case "gray":
            default:
                return rgb(0.35, 0.35, 0.35);
        }
    };

    const getColorCss = (c: WatermarkColor) => {
        switch (c) {
            case "red":
                return "#ef4444";
            case "blue":
                return "#3b82f6";
            case "green":
                return "#10b981";
            case "gray":
            default:
                return "#71717a";
        }
    };

    const applyWatermarkAndSave = async () => {
        if (!file || !watermarkText.trim()) return;
        setIsApplying(true);
        setErrorMessage(null);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            const pages = pdfDoc.getPages();
            const watermarkColor = getPdfLibColor(color);

            pages.forEach((page) => {
                const { width, height } = page.getSize();
                const text = watermarkText.trim();
                const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
                const textHeight = helveticaFont.heightAtSize(fontSize);

                if (layout === "center") {
                    page.drawText(text, {
                        x: width / 2 - (textWidth / 2) * Math.cos((angle * Math.PI) / 180),
                        y: height / 2 - (textWidth / 2) * Math.sin((angle * Math.PI) / 180),
                        size: fontSize,
                        font: helveticaFont,
                        color: watermarkColor,
                        opacity: opacity,
                        rotate: degrees(angle),
                    });
                } else if (layout === "tiled") {
                    const stepX = width / 2.5;
                    const stepY = height / 3.5;

                    for (let x = stepX / 2; x < width; x += stepX) {
                        for (let y = stepY / 2; y < height; y += stepY) {
                            page.drawText(text, {
                                x: x - textWidth / 2,
                                y: y - textHeight / 2,
                                size: fontSize * 0.75,
                                font: helveticaFont,
                                color: watermarkColor,
                                opacity: opacity * 0.85,
                                rotate: degrees(angle),
                            });
                        }
                    }
                }
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });

            setSavedPdfBlob(blob);
            setIsDownloaded(true);
        } catch (error) {
            console.error("Error applying watermark:", error);
            setErrorMessage("Gagal menyisipkan watermark pada dokumen. Silakan coba kembali.");
        } finally {
            setIsApplying(false);
        }
    };

    const openLightbox = () => {
        if (!previewDataUrl) return;
        setLightboxItem({
            url: previewDataUrl,
            title: `Pratinjau Halaman 1 (${file?.name || "Dokumen"})`,
            pageNumber: 1,
            totalPages: pageCount,
            width: previewDimensions.width,
            height: previewDimensions.height,
            aspectRatio: "A4 Portrait"
        });
    };

    const presets = [
        { label: "CASN / CPNS", text: `HANYA UNTUK VERIFIKASI CASN ${currentYear}` },
        { label: "Pribadi / KTP", text: "DOKUMEN PRIBADI - BUKAN UNTUK PINJAMAN ONLINE" },
        { label: "Lamaran Kerja", text: `VERIFIKASI LAMARAN KERJA ${currentYear}` },
        { label: "Bank / KPR", text: "HANYA UNTUK KELENGKAPAN BERKAS BANK" },
        { label: "Draft / Rahasia", text: "DOKUMEN RAHASIA - DRAFT SAJA" }
    ];

    return (
        <div className="space-y-8 w-full max-w-5xl mx-auto">
            {/* Hidden native input for direct file change */}
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
                    title="Tarik & Letakkan File PDF di Sini"
                    description="Mendukung KTP, Ijazah, KK, berkas lamaran, dan dokumen PDF apa saja. Watermark ditambahkan 100% lokal tanpa upload ke server."
                    icons={
                        <div className="flex items-center gap-2 text-rose-500 font-semibold text-sm">
                            <Stamp className="w-5 h-5" />
                            <span>Dokumen PDF (Semua Halaman & Resolusi)</span>
                        </div>
                    }
                />
            ) : isLoading ? (
                <div className="glass-panel p-12 rounded-3xl border border-border/80 text-center space-y-4 shadow-xl">
                    <Loader2 className="w-10 h-10 animate-spin text-rose-500 mx-auto" />
                    <h3 className="text-lg font-bold text-foreground">Menyiapkan Pratinjau Dokumen...</h3>
                    <p className="text-sm text-foreground/60">Membaca halaman PDF secara lokal di memori gawai Anda...</p>
                </div>
            ) : (
                <div className="space-y-8 animate-fade-in">
                    {/* Top File Action Card */}
                    <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-border/80 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                                <Stamp className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-base sm:text-lg text-foreground truncate">
                                    {file.name}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-foreground/60 mt-0.5">
                                    <span>{pageCount} Halaman</span>
                                    <span>•</span>
                                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    <span>•</span>
                                    <span className="text-emerald-400 font-medium">100% Client-Side Injected</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-foreground/80 hover:text-foreground bg-surface hover:bg-surface/80 border border-border/70 rounded-xl transition-all cursor-pointer"
                            >
                                <FolderOpen className="w-4 h-4 text-rose-500" />
                                <span>Ganti PDF</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-all cursor-pointer"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Clear Semua</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Workspace: Settings (Left) & Real-time Live Preview (Right) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left Settings Column */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="glass-panel p-6 rounded-3xl border border-border/80 shadow-xl space-y-6">
                                <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
                                    <Sliders className="w-5 h-5 text-rose-500" />
                                    <h4 className="font-bold text-base text-foreground">Konfigurasi Teks Stempel</h4>
                                </div>

                                {/* Watermark Text Input */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                                        Teks Watermark Pengaman
                                    </label>
                                    <input
                                        type="text"
                                        value={watermarkText}
                                        onChange={(e) => setWatermarkText(e.target.value)}
                                        placeholder="Contoh: HANYA UNTUK VERIFIKASI CASN 2026"
                                        className="w-full px-4 py-3 rounded-xl bg-surface border border-border/80 text-foreground font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                    />
                                </div>

                                {/* Preset Buttons Khas Indonesia */}
                                <div className="space-y-2">
                                    <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">
                                        Pilihan Cepat Instansi / Keperluan:
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {presets.map((preset) => (
                                            <button
                                                key={preset.label}
                                                type="button"
                                                onClick={() => setWatermarkText(preset.text)}
                                                className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                                    watermarkText === preset.text
                                                        ? "bg-rose-500/20 border-rose-500 text-rose-400 font-bold"
                                                        : "bg-surface hover:bg-surface/80 border-border/70 text-foreground/70"
                                                }`}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Styling Options: Color, Opacity, Angle, Layout */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    {/* Color Picker */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider">
                                            Warna Tinta
                                        </label>
                                        <div className="flex items-center gap-2">
                                            {(["red", "blue", "green", "gray"] as WatermarkColor[]).map((c) => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => setColor(c)}
                                                    className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                                                        color === c
                                                            ? "ring-2 ring-rose-500 scale-105 border-transparent"
                                                            : "border-border/80 hover:scale-105"
                                                    }`}
                                                    style={{ backgroundColor: getColorCss(c) }}
                                                    title={`Warna ${c}`}
                                                >
                                                    {color === c && <Check className="w-4 h-4 text-white drop-shadow" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Layout Choice */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider">
                                            Penataan Stempel
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setLayout("center")}
                                                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                                    layout === "center"
                                                        ? "bg-rose-500/15 border-rose-500 text-rose-400 font-bold"
                                                        : "bg-surface border-border text-foreground/70 hover:bg-surface/80"
                                                }`}
                                            >
                                                Tengah (Besar)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setLayout("tiled")}
                                                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                                    layout === "tiled"
                                                        ? "bg-rose-500/15 border-rose-500 text-rose-400 font-bold"
                                                        : "bg-surface border-border text-foreground/70 hover:bg-surface/80"
                                                }`}
                                            >
                                                Ubin Penuh (3×3)
                                            </button>
                                        </div>
                                    </div>

                                    {/* Angle Selector */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider">
                                            Kemiringan Sudut ({angle}°)
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {([-45, 0, 45] as WatermarkAngle[]).map((a) => (
                                                <button
                                                    key={a}
                                                    type="button"
                                                    onClick={() => setAngle(a)}
                                                    className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                                        angle === a
                                                            ? "bg-rose-500/15 border-rose-500 text-rose-400 font-bold"
                                                            : "bg-surface border-border text-foreground/70 hover:bg-surface/80"
                                                    }`}
                                                >
                                                    {a === -45 ? "Diagonal ↗" : a === 0 ? "Datar ➔" : "Diagonal ↘"}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Opacity Slider */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <label className="font-bold text-foreground/70 uppercase tracking-wider">
                                                Transparansi
                                            </label>
                                            <span className="font-semibold text-rose-400">{Math.round(opacity * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="0.9"
                                            step="0.05"
                                            value={opacity}
                                            onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                            className="w-full accent-rose-500 cursor-pointer"
                                        />
                                        <span className="text-[10px] text-foreground/50 block">Rekomendasi: 30% - 40% agar teks dokumen tetap terbaca.</span>
                                    </div>

                                    {/* Font Size Slider */}
                                    <div className="space-y-2 sm:col-span-2">
                                        <div className="flex justify-between text-xs">
                                            <label className="font-bold text-foreground/70 uppercase tracking-wider">
                                                Ukuran Huruf
                                            </label>
                                            <span className="font-semibold text-rose-400">{fontSize} pt</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="18"
                                            max="72"
                                            step="2"
                                            value={fontSize}
                                            onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                                            className="w-full accent-rose-500 cursor-pointer"
                                        />
                                        <span className="text-[10px] text-foreground/50 block">Sesuaikan dengan panjang kalimat Anda.</span>
                                    </div>
                                </div>

                                {/* Download Action Button */}
                                <div className="pt-4 border-t border-border/50">
                                    <button
                                        type="button"
                                        onClick={applyWatermarkAndSave}
                                        disabled={isApplying}
                                        className={`w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-base font-bold text-white shadow-xl transition-all cursor-pointer ${
                                            isApplying
                                                ? "bg-rose-500/50 cursor-not-allowed"
                                                : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 hover:scale-[1.01] active:scale-95"
                                        }`}
                                    >
                                        {isApplying ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Menerapkan Watermark ke {pageCount} Halaman...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Stamp className="w-5 h-5" />
                                                <span>Cap & Tampilkan Hasil PDF ({pageCount} Hal)</span>
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
                                        <Eye className="w-4 h-4 text-rose-500" />
                                        <h4 className="font-bold text-sm text-foreground">Pratinjau Halaman 1 (Real-Time)</h4>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                                        Live Preview
                                    </span>
                                </div>

                                {/* Preview Canvas Container Clickable for Lightbox Zoom */}
                                <div
                                    onClick={openLightbox}
                                    className="relative w-full aspect-3/4 max-w-sm mx-auto bg-black/40 rounded-2xl overflow-hidden border border-border/60 shadow-inner flex items-center justify-center select-none cursor-pointer group/thumb"
                                    title="Klik untuk melihat pratinjau zoom detail"
                                >
                                    {previewDataUrl ? (
                                        <img
                                            src={previewDataUrl}
                                            alt="Pratinjau Dokumen"
                                            className="w-full h-full object-contain rounded-none pointer-events-none"
                                        />
                                    ) : (
                                        <div className="text-center p-6 space-y-2">
                                            <FileText className="w-12 h-12 text-foreground/30 mx-auto" />
                                            <p className="text-xs text-foreground/40">Memuat pratinjau...</p>
                                        </div>
                                    )}

                                    {/* Watermark Overlay Simulation */}
                                    {watermarkText.trim() && (
                                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                                            {layout === "center" ? (
                                                <div
                                                    className="font-black text-center whitespace-nowrap tracking-wide select-none"
                                                    style={{
                                                        color: getColorCss(color),
                                                        opacity,
                                                        fontSize: `${fontSize * 0.45}px`,
                                                        transform: `rotate(${angle}deg)`,
                                                        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                                                    }}
                                                >
                                                    {watermarkText}
                                                </div>
                                            ) : (
                                                <div className="w-full h-full grid grid-cols-3 grid-rows-3 items-center justify-items-center p-2">
                                                    {Array.from({ length: 9 }).map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className="font-black text-center whitespace-nowrap tracking-wide select-none truncate max-w-full"
                                                            style={{
                                                                color: getColorCss(color),
                                                                opacity,
                                                                fontSize: `${fontSize * 0.25}px`,
                                                                transform: `rotate(${angle}deg)`,
                                                                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                                                            }}
                                                        >
                                                            {watermarkText}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Hover Zoom Icon */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="p-2.5 rounded-full bg-rose-500 text-white shadow-lg transform scale-90 group-hover/thumb:scale-100 transition-transform">
                                            <ZoomIn className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                <p className="text-center text-[11px] text-foreground/50 leading-relaxed">
                                    Stempel akan disematkan pada seluruh {pageCount} halaman dokumen dengan kualitas teks tajam & anti-pecah. Klik gambar untuk zoom.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Output Result: Live Embedded PDF Viewer */}
                    {savedPdfBlob && (
                        <div className="space-y-4 pt-4 animate-fade-in">
                            <PdfEmbeddedViewer
                                blob={savedPdfBlob}
                                fileName={`${file.name.replace(/\.pdf$/i, "")}-watermark.pdf`}
                                title="Dokumen PDF Berwatermark Siap Diunduh"
                                accentColor="rose"
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
                accentColor="rose"
            />
        </div>
    );
}
