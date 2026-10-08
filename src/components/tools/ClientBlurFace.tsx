"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Dropzone from "@/components/ui/Dropzone";
import {
    EyeOff,
    Eye,
    Square,
    Paintbrush,
    Sparkles,
    Grid3X3,
    ShieldAlert,
    Trash2,
    Undo2,
    Redo2,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Download,
    CheckCircle2,
    Sliders,
    Maximize2,
    FileImage,
    Info,
    Lock,
    Layers,
    AlertCircle,
    X,
    Check,
    ArrowRight
} from "lucide-react";
import MediaLightboxModal, { LightboxItem } from "@/components/shared/MediaLightboxModal";

export type ToolMode = "box" | "brush";
export type BlurEffectType = "blur" | "pixelate" | "blackout";

export interface PrivacyRegion {
    id: string;
    tool: ToolMode;
    effect: BlurEffectType;
    // Box coordinates (0..1 normalized)
    x: number;
    y: number;
    w: number;
    h: number;
    // Brush coordinates
    points?: { x: number; y: number }[];
    brushSizeRatio?: number; // relative to image width
    intensity: number; // Blur radius (px) or Pixelate block size (px)
}

interface QuickPreset {
    id: string;
    name: string;
    description: string;
    tool: ToolMode;
    effect: BlurEffectType;
    intensity: number;
    badge: string;
}

const QUICK_PRESETS: QuickPreset[] = [
    {
        id: "face-blur",
        name: "Sensor Wajah",
        description: "Gaussian blur halus untuk menjaga privasi orang",
        tool: "box",
        effect: "blur",
        intensity: 22,
        badge: "Populer"
    },
    {
        id: "plate-mosaic",
        name: "Plat Nomor",
        description: "Mosaik TV berita untuk plat kendaraan & teks",
        tool: "box",
        effect: "pixelate",
        intensity: 14,
        badge: "Otomotif"
    },
    {
        id: "nik-blackout",
        name: "Sensor NIK KTP",
        description: "Sensor hitam pekat 100% bebas intip dokumen",
        tool: "box",
        effect: "blackout",
        intensity: 0,
        badge: "Keamanan"
    },
    {
        id: "freehand-brush",
        name: "Kuas Sensor Bebas",
        description: "Sapu area tak beraturan dengan kuas sentuh",
        tool: "brush",
        effect: "blur",
        intensity: 20,
        badge: "Fleksibel"
    }
];

export default function ClientBlurFace() {
    // Berkas & Gambar Asli
    const [file, setFile] = useState<File | null>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

    // Mode alat & Pengaturan Efek
    const [toolMode, setToolMode] = useState<ToolMode>("box");
    const [activeEffect, setActiveEffect] = useState<BlurEffectType>("blur");
    const [blurIntensity, setBlurIntensity] = useState<number>(20); // 4 - 50 px
    const [pixelateSize, setPixelateSize] = useState<number>(14); // 4 - 36 px
    const [brushSize, setBrushSize] = useState<number>(36); // 10 - 90 px

    // Daftar Region & History Undo/Redo
    const [regions, setRegions] = useState<PrivacyRegion[]>([]);
    const [history, setHistory] = useState<PrivacyRegion[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState<number>(0);
    const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

    // Zoom & Navigasi Kanvas
    const [zoomScale, setZoomScale] = useState<number>(1.0);
    const [isPeekingOriginal, setIsPeekingOriginal] = useState<boolean>(false);

    // State Menggambar Interaktif
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
    const [currentBox, setCurrentBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const [currentBrushPoints, setCurrentBrushPoints] = useState<{ x: number; y: number }[]>([]);

    // Ekspor & Unduhan
    const [exportFormat, setExportFormat] = useState<"image/jpeg" | "image/png" | "image/webp">("image/jpeg");
    const [exportQuality, setExportQuality] = useState<number>(0.92);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
    const [exportedUrl, setExportedUrl] = useState<string | null>(null);
    const [exportedSize, setExportedSize] = useState<number>(0);
    const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null);

    // Refs
    const imageRef = useRef<HTMLImageElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Helper: Push ke History Undo
    const pushToHistory = useCallback((newRegions: PrivacyRegion[]) => {
        setHistory((prev) => {
            const next = prev.slice(0, historyIndex + 1);
            next.push(newRegions);
            return next;
        });
        setHistoryIndex((prev) => prev + 1);
        setRegions(newRegions);
    }, [historyIndex]);

    // Handle File Drop / Select
    const handleFileDrop = (acceptedFiles: File[]) => {
        if (!acceptedFiles || acceptedFiles.length === 0) return;
        const selected = acceptedFiles[0];
        if (!selected.type.startsWith("image/")) return;

        // Bersihkan blob lama
        if (imageSrc) URL.revokeObjectURL(imageSrc);
        if (exportedUrl) URL.revokeObjectURL(exportedUrl);

        const objectUrl = URL.createObjectURL(selected);
        const img = new Image();
        img.onload = () => {
            setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
            imageRef.current = img;
            setImageSrc(objectUrl);
            setFile(selected);

            // Reset state
            setRegions([]);
            setHistory([[]]);
            setHistoryIndex(0);
            setSelectedRegionId(null);
            setExportedBlob(null);
            setExportedUrl(null);
            setZoomScale(1.0);
        };
        img.src = objectUrl;
    };

    // Bersihkan Semua (Clean Reset Lifecycle)
    const handleResetAll = () => {
        if (imageSrc) URL.revokeObjectURL(imageSrc);
        if (exportedUrl) URL.revokeObjectURL(exportedUrl);
        setFile(null);
        setImageSrc(null);
        setNaturalSize({ width: 0, height: 0 });
        setRegions([]);
        setHistory([[]]);
        setHistoryIndex(0);
        setSelectedRegionId(null);
        setExportedBlob(null);
        setExportedUrl(null);
        imageRef.current = null;
    };

    // Undo & Redo
    const handleUndo = () => {
        if (historyIndex > 0) {
            const nextIndex = historyIndex - 1;
            setHistoryIndex(nextIndex);
            setRegions(history[nextIndex]);
            setSelectedRegionId(null);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            setHistoryIndex(nextIndex);
            setRegions(history[nextIndex]);
            setSelectedRegionId(null);
        }
    };

    // Hapus satu region
    const handleDeleteRegion = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        const updated = regions.filter((r) => r.id !== id);
        pushToHistory(updated);
        if (selectedRegionId === id) setSelectedRegionId(null);
    };

    // Hapus semua region
    const handleClearAllRegions = () => {
        if (regions.length === 0) return;
        pushToHistory([]);
        setSelectedRegionId(null);
    };

    // Terapkan Preset Cepat
    const applyPreset = (preset: QuickPreset) => {
        setToolMode(preset.tool);
        setActiveEffect(preset.effect);
        if (preset.effect === "blur") setBlurIntensity(preset.intensity);
        if (preset.effect === "pixelate") setPixelateSize(preset.intensity);
    };

    // Render Canvas Pipeline (Digunakan untuk preview interaktif dan ekspor 100% resolusi penuh)
    // Sensor bertumpuk secara kumulatif (stackable): setiap efek sensor memproses kondisi canvas terakhir
    const renderPrivacyCanvas = useCallback(
        (targetCanvas: HTMLCanvasElement, targetScale: number = 1.0, peekOriginal: boolean = false) => {
            const img = imageRef.current;
            if (!img || naturalSize.width === 0 || naturalSize.height === 0) return;

            const cw = Math.round(naturalSize.width * targetScale);
            const ch = Math.round(naturalSize.height * targetScale);
            targetCanvas.width = cw;
            targetCanvas.height = ch;

            const ctx = targetCanvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) return;

            // 1. Gambar foto dasar awal
            ctx.drawImage(img, 0, 0, cw, ch);

            // Jika sedang intip gambar asli, lewati efek sensor
            if (peekOriginal || regions.length === 0) return;

            // Buat canvas pembantu (scratch canvas) untuk mengambil snapshot kondisi terkini kanvas
            const scratchCanvas = document.createElement("canvas");
            scratchCanvas.width = cw;
            scratchCanvas.height = ch;
            const scratchCtx = scratchCanvas.getContext("2d", { willReadFrequently: true });
            if (!scratchCtx) return;

            // 2. Terapkan setiap region sensor secara BERTAHAP / BERTUMPUK (CUMULATIVE STACKING)
            regions.forEach((r) => {
                const rx = Math.round(r.x * cw);
                const ry = Math.round(r.y * ch);
                const rw = Math.round(r.w * cw);
                const rh = Math.round(r.h * ch);

                // --- MODE 1: BLACKOUT (Sensor Hitam Pekat) ---
                if (r.effect === "blackout") {
                    if (r.tool === "box") {
                        ctx.fillStyle = "#000000";
                        ctx.fillRect(rx, ry, rw, rh);
                    } else if (r.tool === "brush" && r.points && r.points.length > 0) {
                        ctx.strokeStyle = "#000000";
                        ctx.fillStyle = "#000000";
                        ctx.lineWidth = Math.round((r.brushSizeRatio || 0.03) * cw);
                        ctx.lineCap = "round";
                        ctx.lineJoin = "round";
                        ctx.beginPath();
                        r.points.forEach((pt, i) => {
                            const px = pt.x * cw;
                            const py = pt.y * ch;
                            if (i === 0) ctx.moveTo(px, py);
                            else ctx.lineTo(px, py);
                        });
                        ctx.stroke();
                        if (r.points.length === 1) {
                            ctx.beginPath();
                            ctx.arc(r.points[0].x * cw, r.points[0].y * ch, ctx.lineWidth / 2, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                    return;
                }

                // Ambil snapshot kondisi canvas TERAKHIR (termasuk semua sensor yang sudah digambar sebelumnya)
                scratchCtx.clearRect(0, 0, cw, ch);
                scratchCtx.drawImage(targetCanvas, 0, 0);

                // --- MODE 2: GAUSSIAN BLUR (BERTUMPUK DARI KONDISI TERAKHIR) ---
                if (r.effect === "blur") {
                    const scaledBlur = Math.max(2, Math.round(r.intensity * targetScale));

                    if (r.tool === "box") {
                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(rx, ry, rw, rh);
                        ctx.clip();
                        ctx.filter = `blur(${scaledBlur}px)`;
                        // Menggambar dari scratchCanvas (kondisi canvas terakhir), BUKAN dari img mentah!
                        ctx.drawImage(scratchCanvas, 0, 0);
                        ctx.restore();
                    } else if (r.tool === "brush" && r.points && r.points.length > 0) {
                        const mask = document.createElement("canvas");
                        mask.width = cw;
                        mask.height = ch;
                        const mCtx = mask.getContext("2d");
                        if (mCtx) {
                            mCtx.strokeStyle = "#ffffff";
                            mCtx.fillStyle = "#ffffff";
                            mCtx.lineWidth = Math.round((r.brushSizeRatio || 0.03) * cw);
                            mCtx.lineCap = "round";
                            mCtx.lineJoin = "round";
                            mCtx.beginPath();
                            r.points.forEach((pt, i) => {
                                const px = pt.x * cw;
                                const py = pt.y * ch;
                                if (i === 0) mCtx.moveTo(px, py);
                                else mCtx.lineTo(px, py);
                            });
                            mCtx.stroke();
                            if (r.points.length === 1) {
                                mCtx.beginPath();
                                mCtx.arc(r.points[0].x * cw, r.points[0].y * ch, mCtx.lineWidth / 2, 0, Math.PI * 2);
                                mCtx.fill();
                            }

                            const blurCanvas = document.createElement("canvas");
                            blurCanvas.width = cw;
                            blurCanvas.height = ch;
                            const bCtx = blurCanvas.getContext("2d");
                            if (bCtx) {
                                bCtx.filter = `blur(${scaledBlur}px)`;
                                bCtx.drawImage(scratchCanvas, 0, 0);
                                bCtx.globalCompositeOperation = "destination-in";
                                bCtx.drawImage(mask, 0, 0);
                                ctx.drawImage(blurCanvas, 0, 0);
                            }
                        }
                    }
                    return;
                }

                // --- MODE 3: PIXELATE / MOSAIK (BERTUMPUK DARI KONDISI TERAKHIR) ---
                if (r.effect === "pixelate") {
                    const blockSize = Math.max(3, Math.round(r.intensity * targetScale));

                    const pixelCanvas = document.createElement("canvas");
                    pixelCanvas.width = cw;
                    pixelCanvas.height = ch;
                    const pCtx = pixelCanvas.getContext("2d");
                    if (pCtx) {
                        const tinyW = Math.max(1, Math.round(cw / blockSize));
                        const tinyH = Math.max(1, Math.round(ch / blockSize));
                        const tiny = document.createElement("canvas");
                        tiny.width = tinyW;
                        tiny.height = tinyH;
                        const tCtx = tiny.getContext("2d");
                        if (tCtx) {
                            // Downsample dari scratchCanvas (kondisi canvas terakhir), BUKAN dari img mentah!
                            tCtx.drawImage(scratchCanvas, 0, 0, tinyW, tinyH);
                            pCtx.imageSmoothingEnabled = false;
                            pCtx.drawImage(tiny, 0, 0, cw, ch);
                        }

                        if (r.tool === "box") {
                            ctx.drawImage(pixelCanvas, rx, ry, rw, rh, rx, ry, rw, rh);
                        } else if (r.tool === "brush" && r.points && r.points.length > 0) {
                            const mask = document.createElement("canvas");
                            mask.width = cw;
                            mask.height = ch;
                            const mCtx = mask.getContext("2d");
                            if (mCtx) {
                                mCtx.strokeStyle = "#ffffff";
                                mCtx.fillStyle = "#ffffff";
                                mCtx.lineWidth = Math.round((r.brushSizeRatio || 0.03) * cw);
                                mCtx.lineCap = "round";
                                mCtx.lineJoin = "round";
                                mCtx.beginPath();
                                r.points.forEach((pt, i) => {
                                    const px = pt.x * cw;
                                    const py = pt.y * ch;
                                    if (i === 0) mCtx.moveTo(px, py);
                                    else mCtx.lineTo(px, py);
                                });
                                mCtx.stroke();
                                if (r.points.length === 1) {
                                    mCtx.beginPath();
                                    mCtx.arc(r.points[0].x * cw, r.points[0].y * ch, mCtx.lineWidth / 2, 0, Math.PI * 2);
                                    mCtx.fill();
                                }

                                pCtx.globalCompositeOperation = "destination-in";
                                pCtx.drawImage(mask, 0, 0);
                                ctx.drawImage(pixelCanvas, 0, 0);
                            }
                        }
                    }
                }
            });
        },
        [naturalSize, regions]
    );

    // Re-render kanvas preview saat state berubah
    useEffect(() => {
        if (!canvasRef.current || !imageRef.current) return;
        renderPrivacyCanvas(canvasRef.current, 1.0, isPeekingOriginal);
    }, [renderPrivacyCanvas, isPeekingOriginal, regions]);

    // Konversi koordinat kursor ke nilai normalisasi (0..1)
    const getNormalizedCoords = (e: React.PointerEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;

        const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
        return { x, y };
    };

    // Event Mulai Menggambar
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!imageSrc) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsDrawing(true);

        const { x, y } = getNormalizedCoords(e);
        setDrawStart({ x, y });

        if (toolMode === "box") {
            setCurrentBox({ x, y, w: 0, h: 0 });
        } else if (toolMode === "brush") {
            setCurrentBrushPoints([{ x, y }]);
        }
    };

    // Event Menggeser Kursor / Sentuhan
    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDrawing || !drawStart) return;

        const { x, y } = getNormalizedCoords(e);

        if (toolMode === "box") {
            const minX = Math.min(drawStart.x, x);
            const minY = Math.min(drawStart.y, y);
            const w = Math.abs(x - drawStart.x);
            const h = Math.abs(y - drawStart.y);
            setCurrentBox({ x: minX, y: minY, w, h });
        } else if (toolMode === "brush") {
            setCurrentBrushPoints((prev) => [...prev, { x, y }]);
        }
    };

    // Event Selesai Menggambar (Lepas Kursor / Jari)
    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDrawing) return;
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
            // Abaikan jika pointer capture gagal
        }

        setIsDrawing(false);

        const activeIntensity = activeEffect === "blur" ? blurIntensity : pixelateSize;

        if (toolMode === "box" && currentBox) {
            // Hindari kotak terlalu kecil yang tidak sengaja terklik
            if (currentBox.w > 0.015 && currentBox.h > 0.015) {
                const newRegion: PrivacyRegion = {
                    id: `region-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    tool: "box",
                    effect: activeEffect,
                    x: currentBox.x,
                    y: currentBox.y,
                    w: currentBox.w,
                    h: currentBox.h,
                    intensity: activeIntensity
                };
                pushToHistory([...regions, newRegion]);
            }
        } else if (toolMode === "brush" && currentBrushPoints.length > 0) {
            // Rasio ukuran kuas terhadap lebar gambar
            const brushRatio = naturalSize.width > 0 ? brushSize / naturalSize.width : 0.035;

            const newRegion: PrivacyRegion = {
                id: `region-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                tool: "brush",
                effect: activeEffect,
                x: 0,
                y: 0,
                w: 1,
                h: 1,
                points: currentBrushPoints,
                brushSizeRatio: Math.max(0.01, Math.min(0.12, brushRatio)),
                intensity: activeIntensity
            };
            pushToHistory([...regions, newRegion]);
        }

        setDrawStart(null);
        setCurrentBox(null);
        setCurrentBrushPoints([]);
    };

    // Jalankan Ekspor Resolusi Penuh HD (100% Client-Side)
    const handleExport = async () => {
        if (!imageRef.current || naturalSize.width === 0 || naturalSize.height === 0) return;

        setIsExporting(true);
        try {
            const exportCanvas = document.createElement("canvas");
            // Render pada 100% dimensi asli
            renderPrivacyCanvas(exportCanvas, 1.0, false);

            exportCanvas.toBlob(
                (blob) => {
                    if (!blob) {
                        setIsExporting(false);
                        return;
                    }
                    if (exportedUrl) URL.revokeObjectURL(exportedUrl);

                    const url = URL.createObjectURL(blob);
                    setExportedBlob(blob);
                    setExportedUrl(url);
                    setExportedSize(blob.size);
                    setIsExporting(false);

                    // Buat file name
                    const baseName = file?.name.replace(/\.[^/.]+$/, "") || "foto";
                    const ext = exportFormat === "image/png" ? "png" : exportFormat === "image/webp" ? "webp" : "jpg";
                    const fileName = `${baseName}-sensor-privasi.${ext}`;

                    // Trigger unduh otomatis
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                },
                exportFormat,
                exportQuality
            );
        } catch (err) {
            console.error("Gagal mengekspor foto:", err);
            setIsExporting(false);
        }
    };

    // Buka Lightbox Modal
    const handleOpenLightbox = () => {
        if (!canvasRef.current) return;
        const currentDataUrl = canvasRef.current.toDataURL("image/jpeg", 0.95);
        setLightboxItem({
            url: currentDataUrl,
            title: `Pratinjau Hasil Sensor (${regions.length} Area Disensor)`,
            width: naturalSize.width,
            height: naturalSize.height,
            mimeType: "image/jpeg"
        });
    };

    // Format ukuran byte
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    return (
        <div className="space-y-8">
            {/* 1. DROPZONE / TAMPILAN AWAL */}
            {!imageSrc ? (
                <div className="space-y-6">
                    <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-border/80 shadow-2xl relative overflow-hidden">
                        <div className="max-w-2xl mx-auto space-y-6">
                            <Dropzone
                                onFilesAccepted={handleFileDrop}
                                accept="image/jpeg,image/png,image/webp,image/avif,image/bmp"
                                title="Pilih atau Tarik Foto ke Sini"
                                description="Mendukung format JPG, PNG, WebP, AVIF & BMP. Foto diproses 100% lokal di browser Anda."
                            />
                        </div>
                    </div>

                    {/* Kartu Edukasi & Rekomendasi Kasus Penggunaan */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="glass-card p-5 rounded-2xl border border-border/60 space-y-2">
                            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                                1
                            </div>
                            <h3 className="font-bold text-foreground text-sm">Privasi Wajah & Anak</h3>
                            <p className="text-xs text-foreground/60 leading-relaxed">
                                Buramkan wajah orang tak dikenal di jalan atau anak kecil sebelum mengunggah foto kegiatan ke media sosial.
                            </p>
                        </div>
                        <div className="glass-card p-5 rounded-2xl border border-border/60 space-y-2">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                                2
                            </div>
                            <h3 className="font-bold text-foreground text-sm">Plat Nomor Kendaraan</h3>
                            <p className="text-xs text-foreground/60 leading-relaxed">
                                Samarkan plat nomor mobil atau motor dengan efek mosaik pixelate khas media berita agar aman dari pelacakan.
                            </p>
                        </div>
                        <div className="glass-card p-5 rounded-2xl border border-border/60 space-y-2">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                                3
                            </div>
                            <h3 className="font-bold text-foreground text-sm">NIK KTP & Nominal Rekening</h3>
                            <p className="text-xs text-foreground/60 leading-relaxed">
                                Tutup NIK, nomor rekening bank, atau nominal saldo dengan balok hitam pekat anti-bocor sebelum dikirim via chat.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                /* 2. WORKSPACE EDITOR SENSOR FOTO INTERAKTIF */
                <div className="space-y-6">
                    {/* Top Action Bar */}
                    <div className="glass-panel p-4 rounded-2xl border border-border/80 flex flex-wrap items-center justify-between gap-4 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                                <EyeOff className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-foreground flex items-center gap-2 truncate max-w-50 sm:max-w-xs">
                                    {file?.name}
                                </h3>
                                <p className="text-xs text-foreground/60">
                                    {naturalSize.width} × {naturalSize.height} px • {formatBytes(file?.size || 0)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Tombol Tahan untuk Lihat Asli */}
                            <button
                                type="button"
                                onMouseDown={() => setIsPeekingOriginal(true)}
                                onMouseUp={() => setIsPeekingOriginal(false)}
                                onMouseLeave={() => setIsPeekingOriginal(false)}
                                onTouchStart={() => setIsPeekingOriginal(true)}
                                onTouchEnd={() => setIsPeekingOriginal(false)}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all select-none ${
                                    isPeekingOriginal
                                        ? "bg-amber-500 text-black shadow-lg scale-95"
                                        : "bg-surface border border-border/80 text-foreground/80 hover:bg-surface-hover"
                                }`}
                                title="Tekan & tahan untuk mengintip foto asli tanpa sensor"
                            >
                                <Eye className="w-4 h-4 text-amber-400" />
                                <span>{isPeekingOriginal ? "Melihat Asli..." : "Tahan: Lihat Asli"}</span>
                            </button>

                            {/* Undo / Redo */}
                            <button
                                type="button"
                                onClick={handleUndo}
                                disabled={historyIndex === 0}
                                className="p-2 rounded-xl bg-surface border border-border/80 text-foreground/80 hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                title="Batalkan (Undo) [Ctrl+Z]"
                            >
                                <Undo2 className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={handleRedo}
                                disabled={historyIndex >= history.length - 1}
                                className="p-2 rounded-xl bg-surface border border-border/80 text-foreground/80 hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                title="Ulangi (Redo) [Ctrl+Y]"
                            >
                                <Redo2 className="w-4 h-4" />
                            </button>

                            {/* Hapus Semua Sensor */}
                            <button
                                type="button"
                                onClick={handleClearAllRegions}
                                disabled={regions.length === 0}
                                className="p-2 rounded-xl bg-surface border border-border/80 text-rose-400 hover:bg-rose-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                title="Hapus Semua Sensor"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            {/* Lightbox Pratinjau HD */}
                            <button
                                type="button"
                                onClick={handleOpenLightbox}
                                className="p-2 rounded-xl bg-surface border border-border/80 text-foreground/80 hover:bg-surface-hover transition-colors"
                                title="Pratinjau Layar Penuh (Zoom & Pan Lightbox)"
                            >
                                <Maximize2 className="w-4 h-4" />
                            </button>

                            {/* Ganti / Batal Berkas */}
                            <button
                                type="button"
                                onClick={handleResetAll}
                                className="px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-border/80 text-foreground/60 hover:text-rose-400 hover:border-rose-500/40 transition-colors flex items-center gap-1.5"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Ganti Foto</span>
                            </button>
                        </div>
                    </div>

                    {/* Toolbar Pengaturan Efek & Alat Seleksi */}
                    <div className="glass-panel p-5 rounded-3xl border border-border/80 space-y-5 shadow-xl">
                        {/* 1. Preset 1-Klik Cepat */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                                    Preset Instan 1-Klik
                                </span>
                                <span className="text-xs text-foreground/50">Pilih skenario siap pakai</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                {QUICK_PRESETS.map((preset) => {
                                    const isMatch =
                                        toolMode === preset.tool &&
                                        activeEffect === preset.effect &&
                                        (preset.effect === "blur"
                                            ? blurIntensity === preset.intensity
                                            : preset.effect === "pixelate"
                                            ? pixelateSize === preset.intensity
                                            : true);
                                    return (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => applyPreset(preset)}
                                            className={`p-3 rounded-2xl border text-left transition-all ${
                                                isMatch
                                                    ? "bg-rose-500/15 border-rose-500/50 shadow-md ring-1 ring-rose-500/30"
                                                    : "bg-surface/60 border-border/60 hover:bg-surface hover:border-border"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-xs text-foreground">{preset.name}</span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface border border-border text-foreground/60">
                                                    {preset.badge}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-foreground/50 mt-1 line-clamp-1">
                                                {preset.description}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. Pilihan Alat & Pilihan Efek Sensor */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border/40">
                            {/* Alat Seleksi: Kotak vs Kuas */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-foreground/70 flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                                    Bentuk Seleksi
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setToolMode("box")}
                                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                                            toolMode === "box"
                                                ? "bg-sky-500/15 border-sky-500 text-sky-400 shadow-sm"
                                                : "bg-surface border-border/60 text-foreground/70 hover:bg-surface-hover"
                                        }`}
                                    >
                                        <Square className="w-4 h-4" />
                                        <span>Kotak Presisi (Box)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setToolMode("brush")}
                                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                                            toolMode === "brush"
                                                ? "bg-sky-500/15 border-sky-500 text-sky-400 shadow-sm"
                                                : "bg-surface border-border/60 text-foreground/70 hover:bg-surface-hover"
                                        }`}
                                    >
                                        <Paintbrush className="w-4 h-4" />
                                        <span>Kuas Sentuh (Brush)</span>
                                    </button>
                                </div>
                            </div>

                            {/* Tipe Efek: Gaussian Blur vs Mosaik vs Hitam */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-foreground/70 flex items-center gap-1.5">
                                    <Sliders className="w-3.5 h-3.5 text-rose-400" />
                                    Gaya Efek Sensor
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setActiveEffect("blur")}
                                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all ${
                                            activeEffect === "blur"
                                                ? "bg-rose-500/15 border-rose-500 text-rose-400 shadow-sm"
                                                : "bg-surface border-border/60 text-foreground/70 hover:bg-surface-hover"
                                        }`}
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        <span>Blur Halus</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveEffect("pixelate")}
                                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all ${
                                            activeEffect === "pixelate"
                                                ? "bg-amber-500/15 border-amber-500 text-amber-400 shadow-sm"
                                                : "bg-surface border-border/60 text-foreground/70 hover:bg-surface-hover"
                                        }`}
                                    >
                                        <Grid3X3 className="w-4 h-4" />
                                        <span>Mosaik</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveEffect("blackout")}
                                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all ${
                                            activeEffect === "blackout"
                                                ? "bg-purple-500/15 border-purple-500 text-purple-400 shadow-sm"
                                                : "bg-surface border-border/60 text-foreground/70 hover:bg-surface-hover"
                                        }`}
                                    >
                                        <ShieldAlert className="w-4 h-4" />
                                        <span>Hitam Pekat</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 3. Slider Kontrol Parameter Efek & Ukuran Kuas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border/40">
                            {/* Slider Efek Terpilih */}
                            {activeEffect === "blur" && (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-medium text-foreground/80">
                                        <span>Kekuatan Blur (Radius)</span>
                                        <span className="font-mono text-rose-400 font-bold">{blurIntensity} px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={4}
                                        max={50}
                                        value={blurIntensity}
                                        onChange={(e) => setBlurIntensity(Number(e.target.value))}
                                        className="w-full accent-rose-500"
                                    />
                                    <div className="flex justify-between text-[10px] text-foreground/40">
                                        <span>Samar (4px)</span>
                                        <span>Kabur Pekat (50px)</span>
                                    </div>
                                </div>
                            )}

                            {activeEffect === "pixelate" && (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-medium text-foreground/80">
                                        <span>Ukuran Kotak Mosaik</span>
                                        <span className="font-mono text-amber-400 font-bold">{pixelateSize} px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={4}
                                        max={36}
                                        value={pixelateSize}
                                        onChange={(e) => setPixelateSize(Number(e.target.value))}
                                        className="w-full accent-amber-500"
                                    />
                                    <div className="flex justify-between text-[10px] text-foreground/40">
                                        <span>Kecil Halus (4px)</span>
                                        <span>Kotak Besar TV (36px)</span>
                                    </div>
                                </div>
                            )}

                            {activeEffect === "blackout" && (
                                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-center gap-2">
                                    <Lock className="w-4 h-4 shrink-0" />
                                    <span>Sensor Hitam Pekat menutup 100% piksel tanpa transparansi.</span>
                                </div>
                            )}

                            {/* Slider Ukuran Kuas (Khusus mode Brush) */}
                            {toolMode === "brush" ? (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-medium text-foreground/80">
                                        <span>Ketebalan Kuas (Brush Size)</span>
                                        <span className="font-mono text-sky-400 font-bold">{brushSize} px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={10}
                                        max={80}
                                        value={brushSize}
                                        onChange={(e) => setBrushSize(Number(e.target.value))}
                                        className="w-full accent-sky-500"
                                    />
                                    <div className="flex justify-between text-[10px] text-foreground/40">
                                        <span>Presisi (10px)</span>
                                        <span>Sapu Lebar (80px)</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 rounded-xl bg-surface border border-border/60 text-xs text-foreground/60 flex items-center gap-2">
                                    <Info className="w-4 h-4 text-sky-400 shrink-0" />
                                    <span>Klik & seret kursor pada gambar untuk membuat kotak sensor.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* KANVAS INTERAKTIF KERJA UTAMA */}
                    <div className="glass-panel p-4 rounded-3xl border border-border/80 shadow-2xl space-y-3">
                        <div className="flex items-center justify-between text-xs text-foreground/60 px-1">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                                {toolMode === "box" ? "Mode Kotak: Seret untuk menyensor" : "Mode Kuas: Gambar sapuan bebas"}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setZoomScale((prev) => Math.max(0.5, prev - 0.25))}
                                    className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border/60"
                                    title="Perkecil Zoom"
                                >
                                    <ZoomOut className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-mono font-bold w-12 text-center">
                                    {Math.round(zoomScale * 100)}%
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setZoomScale((prev) => Math.min(2.5, prev + 0.25))}
                                    className="p-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-border/60"
                                    title="Perbesar Zoom"
                                >
                                    <ZoomIn className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setZoomScale(1.0)}
                                    className="px-2 py-1 rounded-lg bg-surface hover:bg-surface-hover border border-border/60 text-[11px]"
                                    title="Reset ke 100%"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Wadah Kanvas & Interaksi Drag */}
                        <div
                            ref={containerRef}
                            className="relative overflow-auto max-h-162.5 min-h-87.5 rounded-2xl bg-black/40 border border-border/60 flex items-center justify-center p-4 touch-none select-none cursor-crosshair"
                        >
                            <div
                                className="relative transition-transform duration-75 origin-center"
                                style={{
                                    transform: `scale(${zoomScale})`
                                }}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                            >
                                {/* Kanvas Hasil Render Real-Time */}
                                <canvas
                                    ref={canvasRef}
                                    className="max-w-full max-h-150 object-contain rounded-xl shadow-2xl block"
                                    style={{
                                        imageRendering: "auto"
                                    }}
                                />

                                {/* Overlay Kotak Sedang Digambar */}
                                {isDrawing && toolMode === "box" && currentBox && (
                                    <div
                                        className="absolute border-2 border-dashed border-rose-400 bg-rose-500/20 pointer-events-none rounded-sm transition-none shadow-lg"
                                        style={{
                                            left: `${currentBox.x * 100}%`,
                                            top: `${currentBox.y * 100}%`,
                                            width: `${currentBox.w * 100}%`,
                                            height: `${currentBox.h * 100}%`
                                        }}
                                    >
                                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-white font-mono">
                                            {activeEffect.toUpperCase()}
                                        </div>
                                    </div>
                                )}

                                {/* Overlay Coretan Kuas Sedang Digambar */}
                                {isDrawing && toolMode === "brush" && currentBrushPoints.length > 0 && (
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                        <path
                                            d={currentBrushPoints.reduce(
                                                (acc, pt, i) =>
                                                    i === 0
                                                        ? `M ${pt.x * 100}% ${pt.y * 100}%`
                                                        : `${acc} L ${pt.x * 100}% ${pt.y * 100}%`,
                                                ""
                                            )}
                                            fill="none"
                                            stroke="rgba(244, 63, 94, 0.7)"
                                            strokeWidth={Math.max(4, (brushSize / (naturalSize.width || 1000)) * 100) + "%"}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                )}

                                {/* Overlay Badge Penanda Region Tersimpan */}
                                {!isDrawing &&
                                    regions.map((r, idx) => {
                                        const isSelected = selectedRegionId === r.id;
                                        if (r.tool === "box") {
                                            return (
                                                <div
                                                    key={r.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedRegionId(r.id);
                                                    }}
                                                    className={`absolute border rounded-sm transition-all group pointer-events-auto cursor-pointer ${
                                                        isSelected
                                                            ? "border-rose-400 bg-rose-500/10 ring-2 ring-rose-400/50"
                                                            : "border-white/20 hover:border-rose-400 hover:bg-rose-500/10"
                                                    }`}
                                                    style={{
                                                        left: `${r.x * 100}%`,
                                                        top: `${r.y * 100}%`,
                                                        width: `${r.w * 100}%`,
                                                        height: `${r.h * 100}%`
                                                    }}
                                                >
                                                    <div className="absolute -top-2.5 -left-1 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                                        <span className="px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-white shadow">
                                                            #{idx + 1} {r.effect}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleDeleteRegion(r.id, e)}
                                                            className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 shadow"
                                                            title="Hapus sensor ini"
                                                        >
                                                            <X className="w-2.5 h-2.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // Highlight sapuan kuas jika dipilih
                                        if (r.tool === "brush" && isSelected && r.points && r.points.length > 0) {
                                            return (
                                                <svg key={r.id} className="absolute inset-0 w-full h-full pointer-events-none">
                                                    <path
                                                        d={r.points.reduce(
                                                            (acc, pt, i) =>
                                                                i === 0
                                                                    ? `M ${pt.x * 100}% ${pt.y * 100}%`
                                                                    : `${acc} L ${pt.x * 100}% ${pt.y * 100}%`,
                                                            ""
                                                        )}
                                                        fill="none"
                                                        stroke="rgba(244, 63, 94, 0.8)"
                                                        strokeDasharray="6 4"
                                                        strokeWidth={Math.max(4, (r.brushSizeRatio || 0.03) * 100) + "%"}
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            );
                                        }
                                        return null;
                                    })}
                            </div>
                        </div>
                    </div>

                    {/* DAFTAR REGION SENSOR AKTIF & KONTROL EKSPOR */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* List Area Sensor */}
                        <div className="glass-panel p-5 rounded-3xl border border-border/80 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-rose-400" />
                                    Area Disensor ({regions.length})
                                </h4>
                                {regions.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleClearAllRegions}
                                        className="text-xs text-rose-400 hover:underline"
                                    >
                                        Hapus Semua
                                    </button>
                                )}
                            </div>

                            {regions.length === 0 ? (
                                <div className="p-6 text-center text-xs text-foreground/50 border border-dashed border-border/80 rounded-2xl space-y-1">
                                    <EyeOff className="w-8 h-8 text-foreground/20 mx-auto" />
                                    <p className="font-medium text-foreground/70">Belum ada sensor yang dibuat</p>
                                    <p>Seret kursor pada foto untuk mulai menutup area sensitif.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                    {regions.map((r, idx) => (
                                        <div
                                            key={r.id}
                                            onClick={() => setSelectedRegionId(r.id)}
                                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors cursor-pointer ${
                                                selectedRegionId === r.id
                                                    ? "bg-rose-500/15 border-rose-500/50"
                                                    : "bg-surface/80 border-border/60 hover:bg-surface"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-lg bg-surface border border-border flex items-center justify-center font-bold text-[10px]">
                                                    {idx + 1}
                                                </span>
                                                <div>
                                                    <span className="font-semibold text-foreground capitalize">
                                                        {r.effect === "blur"
                                                            ? "Gaussian Blur"
                                                            : r.effect === "pixelate"
                                                            ? "Mosaik TV"
                                                            : "Kotak Hitam"}
                                                    </span>
                                                    <span className="text-[10px] text-foreground/50 ml-1.5">
                                                        ({r.tool === "box" ? "Kotak" : "Kuas"})
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteRegion(r.id, e)}
                                                className="p-1 rounded-lg text-foreground/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Opsi Format Ekspor & Tombol Unduh HD */}
                        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-border/80 space-y-5 shadow-xl">
                            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                                <Download className="w-4 h-4 text-emerald-400" />
                                Pengaturan Ekspor & Unduhan
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Pilihan Format Gambar */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground/70">Format Berkas</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setExportFormat("image/jpeg")}
                                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                                                exportFormat === "image/jpeg"
                                                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                                                    : "bg-surface border-border/60 text-foreground/70 hover:bg-surface-hover"
                                            }`}
                                        >
                                            JPG
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setExportFormat("image/png")}
                                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                                                exportFormat === "image/png"
                                                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                                                    : "bg-surface border-border/60 text-foreground/70 hover:bg-surface-hover"
                                            }`}
                                        >
                                            PNG
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setExportFormat("image/webp")}
                                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                                                exportFormat === "image/webp"
                                                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                                                    : "bg-surface border-border/60 text-foreground/70 hover:bg-surface-hover"
                                            }`}
                                        >
                                            WebP
                                        </button>
                                    </div>
                                </div>

                                {/* Slider Kualitas JPG/WebP */}
                                {exportFormat !== "image/png" ? (
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-bold text-foreground/70">
                                            <span>Kualitas Gambar</span>
                                            <span className="font-mono text-emerald-400">
                                                {Math.round(exportQuality * 100)}%
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min={0.7}
                                            max={1.0}
                                            step={0.02}
                                            value={exportQuality}
                                            onChange={(e) => setExportQuality(Number(e.target.value))}
                                            className="w-full accent-emerald-500"
                                        />
                                        <div className="flex justify-between text-[10px] text-foreground/40">
                                            <span>Kecil (70%)</span>
                                            <span>Maksimal HD (100%)</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 rounded-xl bg-surface border border-border/60 text-xs text-foreground/60 flex items-center gap-2">
                                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>Format PNG diekspor Lossless (tanpa penurunan ketajaman).</span>
                                    </div>
                                )}
                            </div>

                            {/* Tombol Ekspor Utama */}
                            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-xs text-foreground/60 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-emerald-400" />
                                    <span>
                                        Hasil diekspor pada resolusi penuh {naturalSize.width} × {naturalSize.height} px.
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleExport}
                                    disabled={isExporting}
                                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-linear-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-xl shadow-rose-500/20 hover:shadow-rose-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isExporting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Mengekspor Foto...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4" />
                                            <span>Simpan & Unduh Foto HD</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* LIGHTBOX FULLSCREEN INSPECTION */}
            {lightboxItem && (
                <MediaLightboxModal
                    isOpen={Boolean(lightboxItem)}
                    item={lightboxItem}
                    onClose={() => setLightboxItem(null)}
                    accentColor="rose"
                />
            )}
        </div>
    );
}
