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
    HardDrive,
    FolderOpen,
    Check,
    RotateCcw,
    ShieldAlert,
    Sliders,
    Eye,
    Type
} from "lucide-react";

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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileAccepted = async (acceptedFiles: File[]) => {
        const pdfFile = acceptedFiles.find(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
        if (!pdfFile) {
            alert("Silakan pilih berkas dokumen berformat PDF.");
            return;
        }

        setFile(pdfFile);
        setIsLoading(true);
        setPreviewDataUrl("");
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
                await firstPage.render({ canvasContext: context, viewport, canvas }).promise;
                const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
                setPreviewDataUrl(dataUrl);
                setPreviewDimensions({ width: viewport.width, height: viewport.height });
            }
        } catch (error) {
            console.error("Error loading PDF preview:", error);
            alert("Gagal membaca dokumen PDF. Pastikan file valid atau tidak terenkripsi rusak.");
            setFile(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        setFile(null);
        setPreviewDataUrl("");
        setPageCount(0);
        setIsDownloaded(false);
        setIsLoading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const presets = [
        { label: "Verifikasi CASN / BKN", text: `HANYA UNTUK VERIFIKASI CASN ${currentYear}` },
        { label: "Pembukaan Rekening Bank", text: "HANYA UNTUK PEMBUKAAN REKENING BANK" },
        { label: "Verifikasi Identitas", text: "HANYA UNTUK VERIFIKASI IDENTITAS" },
        { label: "Dokumen Rahasia", text: "CONFIDENTIAL - DOKUMEN RAHASIA" },
        { label: "Salinan Dokumen", text: "SALINAN / COPY ONLY" },
    ];

    const getColorRgb = (c: WatermarkColor): [number, number, number] => {
        switch (c) {
            case "red":
                return [0.85, 0.15, 0.15]; // Red
            case "blue":
                return [0.15, 0.4, 0.9]; // Blue
            case "green":
                return [0.1, 0.65, 0.3]; // Green
            case "gray":
            default:
                return [0.3, 0.3, 0.35]; // Neutral dark gray
        }
    };

    const getColorCss = (c: WatermarkColor): string => {
        switch (c) {
            case "red":
                return "#ef4444";
            case "blue":
                return "#3b82f6";
            case "green":
                return "#10b981";
            case "gray":
            default:
                return "#94a3b8";
        }
    };

    const applyWatermarkAndDownload = async () => {
        if (!file || !watermarkText.trim()) {
            alert("Teks watermark tidak boleh kosong.");
            return;
        }

        setIsApplying(true);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const [r, g, b] = getColorRgb(color);
            const textToDraw = watermarkText.trim();

            const pages = pdfDoc.getPages();
            const textWidth = font.widthOfTextAtSize(textToDraw, fontSize);
            const textHeight = font.heightAtSize(fontSize);
            const rad = (angle * Math.PI) / 180;

            pages.forEach((page) => {
                const { width, height } = page.getSize();

                const drawAtCenter = (cx: number, cy: number) => {
                    const x = cx - (textWidth / 2) * Math.cos(rad) + (textHeight / 2) * Math.sin(rad);
                    const y = cy - (textWidth / 2) * Math.sin(rad) - (textHeight / 2) * Math.cos(rad);

                    page.drawText(textToDraw, {
                        x,
                        y,
                        size: fontSize,
                        font,
                        color: rgb(r, g, b),
                        opacity,
                        rotate: degrees(angle),
                    });
                };

                if (layout === "center") {
                    drawAtCenter(width / 2, height / 2);
                } else {
                    // Tiled 3x3 pattern
                    const cols = [width * 0.25, width * 0.5, width * 0.75];
                    const rows = [height * 0.25, height * 0.5, height * 0.75];
                    cols.forEach(cx => {
                        rows.forEach(cy => {
                            drawAtCenter(cx, cy);
                        });
                    });
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
            a.download = `${baseName}-watermark.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setIsDownloaded(true);
        } catch (error) {
            console.error("Error applying watermark:", error);
            alert("Gagal menyisipkan watermark pada dokumen. Silakan coba kembali.");
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <div className="space-y-8 w-full">
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

            {!file ? (
                <div className="animate-fade-in">
                    <Dropzone
                        onFilesAccepted={handleFileAccepted}
                        accept="application/pdf"
                        title="Tarik & Letakkan File PDF di Sini"
                        description="Mendukung KTP, Ijazah, KK, berkas lamaran, dan dokumen PDF apapun. Watermark ditambahkan 100% lokal tanpa upload ke server."
                        icons={
                            <div className="flex items-center gap-2 text-rose-500 font-semibold text-sm">
                                <FileText className="w-5 h-5" />
                                <span>Dokumen PDF (Semua Halaman & Resolusi)</span>
                            </div>
                        }
                    />
                </div>
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
                            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
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
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-foreground/80 hover:text-foreground bg-surface hover:bg-surface/80 border border-border/70 rounded-xl transition-all active:scale-95"
                            >
                                <FolderOpen className="w-4 h-4 text-rose-500" />
                                <span>Ganti PDF</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-foreground/70 hover:text-rose-400 bg-surface hover:bg-rose-500/10 border border-border/70 hover:border-rose-500/30 rounded-xl transition-all active:scale-95"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Clear</span>
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
                                                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${watermarkText === preset.text
                                                    ? "bg-rose-500/20 text-rose-400 border-rose-500/40 ring-1 ring-rose-500/30"
                                                    : "bg-surface hover:bg-surface/80 text-foreground/70 border-border/60"
                                                    }`}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Style Attributes Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-border/40">
                                    {/* Color Picker */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                                            Warna Tinta
                                        </label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                { key: "red" as WatermarkColor, label: "Merah", bg: "bg-red-500" },
                                                { key: "gray" as WatermarkColor, label: "Abu-abu", bg: "bg-slate-400" },
                                                { key: "blue" as WatermarkColor, label: "Biru", bg: "bg-blue-500" },
                                                { key: "green" as WatermarkColor, label: "Hijau", bg: "bg-emerald-500" },
                                            ].map((c) => (
                                                <button
                                                    key={c.key}
                                                    type="button"
                                                    onClick={() => setColor(c.key)}
                                                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${color === c.key
                                                        ? "border-foreground/80 bg-surface/80 ring-2 ring-rose-500/30"
                                                        : "border-border/60 bg-surface/40 hover:bg-surface"
                                                        }`}
                                                >
                                                    <span className={`w-4 h-4 rounded-full ${c.bg}`}></span>
                                                    <span className="text-[10px] font-semibold text-foreground/70">{c.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Angle Selector */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                                            Kemiringan Sudut
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { key: -45 as WatermarkAngle, label: "Diagonal (-45°)" },
                                                { key: 0 as WatermarkAngle, label: "Datar (0°)" },
                                                { key: 45 as WatermarkAngle, label: "Diagonal (+45°)" },
                                            ].map((a) => (
                                                <button
                                                    key={a.key}
                                                    type="button"
                                                    onClick={() => setAngle(a.key)}
                                                    className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold transition-all ${angle === a.key
                                                        ? "bg-rose-500/20 text-rose-400 border-rose-500/40 ring-1 ring-rose-500/30"
                                                        : "bg-surface/40 border-border/60 hover:bg-surface text-foreground/70"
                                                        }`}
                                                >
                                                    {a.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Layout & Sliders */}
                                <div className="space-y-4 pt-2 border-t border-border/40">
                                    {/* Layout Mode */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                                            Pola Penempatan
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setLayout("center")}
                                                className={`p-3 rounded-xl border text-left transition-all ${layout === "center"
                                                    ? "bg-rose-500/15 border-rose-500/50 text-foreground ring-1 ring-rose-500/30"
                                                    : "bg-surface/40 border-border/60 hover:bg-surface text-foreground/70"
                                                    }`}
                                            >
                                                <div className="text-xs font-bold">Tengah Halaman (Center)</div>
                                                <div className="text-[10px] text-foreground/50 mt-0.5">Satu cap diagonal besar di tengah</div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setLayout("tiled")}
                                                className={`p-3 rounded-xl border text-left transition-all ${layout === "tiled"
                                                    ? "bg-rose-500/15 border-rose-500/50 text-foreground ring-1 ring-rose-500/30"
                                                    : "bg-surface/40 border-border/60 hover:bg-surface text-foreground/70"
                                                    }`}
                                            >
                                                <div className="text-xs font-bold">Pola Berulang (Tiled 3x3)</div>
                                                <div className="text-[10px] text-foreground/50 mt-0.5">Mencegah crop atau manipulasi tepi</div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Sliders: Opacity & Size */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-foreground/70 uppercase tracking-wider">Transparansi:</span>
                                                <span className="text-rose-400 font-mono">{Math.round(opacity * 100)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="0.8"
                                                step="0.05"
                                                value={opacity}
                                                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                                className="w-full accent-rose-500 cursor-pointer"
                                            />
                                            <span className="text-[10px] text-foreground/50 block">Disarankan 25-40% agar teks dokumen tetap terbaca.</span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span className="text-foreground/70 uppercase tracking-wider">Ukuran Huruf:</span>
                                                <span className="text-rose-400 font-mono">{fontSize} pt</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="18"
                                                max="72"
                                                step="2"
                                                value={fontSize}
                                                onChange={(e) => setFontSize(parseInt(e.target.value))}
                                                className="w-full accent-rose-500 cursor-pointer"
                                            />
                                            <span className="text-[10px] text-foreground/50 block">Sesuaikan dengan panjang kalimat Anda.</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Download Action Button */}
                                <div className="pt-4 border-t border-border/50">
                                    <button
                                        type="button"
                                        onClick={applyWatermarkAndDownload}
                                        disabled={isApplying}
                                        className={`w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-base font-bold text-white shadow-xl transition-all ${isApplying
                                            ? "bg-rose-500/50 cursor-not-allowed"
                                            : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 hover:scale-[1.01] active:scale-95 cursor-pointer"
                                            }`}
                                    >
                                        {isApplying ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Menerapkan Watermark ke {pageCount} Halaman...</span>
                                            </>
                                        ) : isDownloaded ? (
                                            <>
                                                <Check className="w-5 h-5" />
                                                <span>Unduh Ulang Dokumen Bertanda</span>
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-5 h-5" />
                                                <span>Cap & Unduh PDF Berwatermark</span>
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

                                {/* Preview Canvas Container */}
                                <div className="relative w-full aspect-3/4 max-w-sm mx-auto bg-black/40 rounded-2xl overflow-hidden border border-border/60 shadow-inner flex items-center justify-center select-none">
                                    {previewDataUrl ? (
                                        <img
                                            src={previewDataUrl}
                                            alt="Pratinjau Dokumen"
                                            className="w-full h-full object-contain"
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
                                                        fontSize: `${fontSize * 0.45}px`, // Scaled for preview viewport
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
                                </div>

                                <p className="text-center text-[11px] text-foreground/50 leading-relaxed">
                                    Stempel akan disematkan pada seluruh {pageCount} halaman dokumen dengan kualitas teks tajam & anti-pecah.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
