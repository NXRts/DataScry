"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Dropzone from "@/components/ui/Dropzone";
import JSZip from "jszip";
import {
    Stamp,
    Download,
    Sparkles,
    CheckCircle2,
    Loader2,
    FolderArchive,
    Sliders,
    Eye,
    AlertCircle,
    X,
    Plus,
    Type,
    Image as ImageIcon,
    Check,
    RotateCcw,
    ShieldCheck,
    Calendar,
    LayoutGrid,
    ZoomIn,
    Trash2,
    Layers,
    FileImage
} from "lucide-react";
import MediaLightboxModal, { LightboxItem } from "@/components/shared/MediaLightboxModal";

// Tipe mode cap air
type WatermarkMode = "text" | "logo";
type WatermarkLayout = "tiled" | "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
type OutputFormat = "original" | "image/jpeg" | "image/png" | "image/webp";

interface ImageItem {
    id: string;
    file: File;
    name: string;
    size: number;
    type: string;
    url: string;
    width: number;
    height: number;
    imgElement: HTMLImageElement;
}

// Preset Warna Cepat
const COLOR_SWATCHES = [
    { label: "Merah", hex: "#ef4444", border: "border-red-500" },
    { label: "Hitam", hex: "#0f172a", border: "border-slate-800" },
    { label: "Putih", hex: "#ffffff", border: "border-white" },
    { label: "Abu-abu", hex: "#64748b", border: "border-slate-500" },
    { label: "Biru", hex: "#2563eb", border: "border-blue-600" },
    { label: "Hijau", hex: "#16a34a", border: "border-emerald-600" },
    { label: "Emas", hex: "#eab308", border: "border-amber-500" }
];

export default function ClientWatermarkImage() {
    const currentYear = new Date().getFullYear();
    const todayFormatted = useMemo(() => {
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }, []);

    // File State
    const [images, setImages] = useState<ImageItem[]>([]);
    const [activeIdx, setActiveIdx] = useState<number>(0);
    const [isLoadingImages, setIsLoadingImages] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Watermark Configuration
    const [mode, setMode] = useState<WatermarkMode>("text");
    const [watermarkText, setWatermarkText] = useState<string>(
        `HANYA UNTUK VERIFIKASI APLIKASI\nTGL ${todayFormatted}`
    );
    const [textColor, setTextColor] = useState<string>("#ef4444");
    const [opacity, setOpacity] = useState<number>(0.35);
    const [fontSize, setFontSize] = useState<number>(36);
    const [angle, setAngle] = useState<number>(-30);
    const [layout, setLayout] = useState<WatermarkLayout>("tiled");
    const [tiledSpacing, setTiledSpacing] = useState<number>(50); // 30 - 80
    const [hasOutline, setHasOutline] = useState<boolean>(true);

    // Logo Configuration
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
    const [logoScale, setLogoScale] = useState<number>(25); // 10% - 70% of image width
    const [logoOpacity, setLogoOpacity] = useState<number>(0.5);
    const [logoAngle, setLogoAngle] = useState<number>(0);

    // Output Settings
    const [outputFormat, setOutputFormat] = useState<OutputFormat>("original");
    const [quality, setQuality] = useState<number>(95);
    const [customFileName, setCustomFileName] = useState<string>("foto-watermark");

    // Processing & Lightbox
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);
    const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null);

    // Canvas references
    const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const fileAddInputRef = useRef<HTMLInputElement | null>(null);
    const logoInputRef = useRef<HTMLInputElement | null>(null);

    const activeImage = images[activeIdx] || null;

    // Presets Khas Indonesia & Keamanan Foto
    const presets = [
        {
            title: "Verifikasi KTP / SIM",
            desc: "Paling direkomendasikan untuk mencegah pinjol ilegal",
            text: `HANYA UNTUK VERIFIKASI APLIKASI\nTGL ${todayFormatted}`,
            color: "#ef4444",
            angle: -30,
            opacity: 0.35,
            layout: "tiled" as WatermarkLayout,
            hasOutline: true
        },
        {
            title: "Anti-Pinjol Ilegal",
            desc: "Proteksi penuh seluruh bagian e-KTP",
            text: "DOKUMEN PRIBADI - PENGAMANAN NIK\nBUKAN UNTUK PINJAMAN ONLINE",
            color: "#ef4444",
            angle: -45,
            opacity: 0.4,
            layout: "tiled" as WatermarkLayout,
            hasOutline: true
        },
        {
            title: "CASN / CPNS 2026",
            desc: "Cap dokumen resmi seleksi instansi pemerintah",
            text: `HANYA UNTUK SELEKSI CASN ${currentYear}\nKEMENTERIAN / INSTANSI RESMI`,
            color: "#2563eb",
            angle: -30,
            opacity: 0.35,
            layout: "tiled" as WatermarkLayout,
            hasOutline: true
        },
        {
            title: "Lamaran Kerja",
            desc: "Bubuhi cap seleksi rekrutmen perusahaan",
            text: `VERIFIKASI LAMARAN KERJA\n${todayFormatted}`,
            color: "#64748b",
            angle: -30,
            opacity: 0.4,
            layout: "center" as WatermarkLayout,
            hasOutline: true
        },
        {
            title: "Sampel / Draft",
            desc: "Lindungi portofolio karya & draf dokumen",
            text: "CONTOH SAJA - SAMPLE ONLY\nDOKUMEN RAHASIA",
            color: "#64748b",
            angle: -45,
            opacity: 0.3,
            layout: "tiled" as WatermarkLayout,
            hasOutline: true
        },
        {
            title: "Hak Cipta Fotografi",
            desc: "Stempel copyright di sudut foto",
            text: `© ${currentYear} DATA SCRY PHOTOGRAPHY\nALL RIGHTS RESERVED`,
            color: "#ffffff",
            angle: 0,
            opacity: 0.7,
            layout: "bottom-right" as WatermarkLayout,
            hasOutline: true
        }
    ];

    const applyPreset = (preset: typeof presets[0]) => {
        setMode("text");
        setWatermarkText(preset.text);
        setTextColor(preset.color);
        setAngle(preset.angle);
        setOpacity(preset.opacity);
        setLayout(preset.layout);
        setHasOutline(preset.hasOutline);
    };

    // Load multiple image files into memory
    const handleFilesAccepted = async (acceptedFiles: File[]) => {
        const imageFiles = acceptedFiles.filter((f) => f.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|avif|bmp|gif)$/i.test(f.name));

        if (imageFiles.length === 0) {
            setErrorMessage("Silakan pilih berkas gambar yang valid (JPG, PNG, WebP, AVIF).");
            return;
        }

        setIsLoadingImages(true);
        setErrorMessage(null);

        try {
            const loadedItems: ImageItem[] = await Promise.all(
                imageFiles.map(async (file) => {
                    const url = URL.createObjectURL(file);
                    const img = new Image();
                    img.src = url;
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = () => reject(new Error(`Gagal memuat gambar ${file.name}`));
                    });

                    return {
                        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                        file,
                        name: file.name,
                        size: file.size,
                        type: file.type || "image/jpeg",
                        url,
                        width: img.naturalWidth || img.width,
                        height: img.naturalHeight || img.height,
                        imgElement: img
                    };
                })
            );

            setImages((prev) => {
                const combined = [...prev, ...loadedItems];
                if (prev.length === 0 && combined.length > 0) {
                    const firstBaseName = combined[0].name.replace(/\.[^/.]+$/, "");
                    const cleanName = firstBaseName.replace(/[/\\?%*:|"<>]/g, "").trim();
                    setCustomFileName(cleanName ? `${cleanName}-watermark` : "foto-watermark");
                }
                return combined;
            });
        } catch (err) {
            console.error("Gagal memuat gambar:", err);
            setErrorMessage("Terjadi kesalahan saat memproses gambar. Pastikan format gambar didukung.");
        } finally {
            setIsLoadingImages(false);
        }
    };

    // Handle Logo Image Upload
    const handleLogoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setErrorMessage("Berkas stempel logo harus berupa format gambar (PNG disarankan).");
            return;
        }

        const url = URL.createObjectURL(file);
        const img = new Image();
        img.src = url;
        img.onload = () => {
            setLogoFile(file);
            setLogoUrl(url);
            setLogoImg(img);
            setMode("logo");
            setErrorMessage(null);
        };
        img.onerror = () => {
            setErrorMessage("Gagal membaca gambar logo.");
        };
    };

    // Remove single image from batch
    const removeImage = (id: string) => {
        setImages((prev) => {
            const filtered = prev.filter((item) => item.id !== id);
            if (activeIdx >= filtered.length) {
                setActiveIdx(Math.max(0, filtered.length - 1));
            }
            return filtered;
        });
    };

    const handleClearAll = () => {
        images.forEach((item) => URL.revokeObjectURL(item.url));
        if (logoUrl) URL.revokeObjectURL(logoUrl);
        setImages([]);
        setActiveIdx(0);
        setLogoFile(null);
        setLogoUrl(null);
        setLogoImg(null);
        setErrorMessage(null);
        setCustomFileName("foto-watermark");
    };

    // Render watermark onto any target canvas (either preview or full-res export)
    const renderWatermarkOnCanvas = useCallback(
        (targetCanvas: HTMLCanvasElement, targetImg: HTMLImageElement, isHighRes: boolean = false) => {
            const ctx = targetCanvas.getContext("2d", { willReadFrequently: false });
            if (!ctx) return;

            const w = isHighRes ? targetImg.naturalWidth : targetCanvas.width;
            const h = isHighRes ? targetImg.naturalHeight : targetCanvas.height;

            if (isHighRes) {
                targetCanvas.width = w;
                targetCanvas.height = h;
            }

            // Draw original image
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(targetImg, 0, 0, w, h);

            const baseDim = Math.max(w, h);

            if (mode === "text") {
                const text = watermarkText.trim();
                if (!text) return;

                const lines = text.split("\n").filter((l) => l.trim().length > 0);
                if (lines.length === 0) return;

                // Scale font proportionally to image dimension
                const effectiveFontSize = Math.max(12, Math.round((fontSize / 1000) * baseDim));
                const lineHeight = effectiveFontSize * 1.25;

                ctx.save();
                ctx.font = `900 ${effectiveFontSize}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.globalAlpha = opacity;
                ctx.fillStyle = textColor;

                // Determine contrast outline color (if textColor is bright, outline is dark; else outline is white)
                const isLightColor = textColor.toLowerCase() === "#ffffff" || textColor.toLowerCase() === "#eab308";
                const strokeColor = isLightColor ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.75)";
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = Math.max(2, Math.round(effectiveFontSize * 0.08));
                ctx.lineJoin = "round";

                // Measure widest line
                let maxLineWidth = 0;
                lines.forEach((l) => {
                    const m = ctx.measureText(l);
                    if (m.width > maxLineWidth) maxLineWidth = m.width;
                });

                const blockWidth = maxLineWidth;
                const blockHeight = lines.length * lineHeight;

                if (layout === "tiled") {
                    // Staggered Diagonal Grid covering the entire image
                    const rad = (angle * Math.PI) / 180;
                    ctx.translate(w / 2, h / 2);
                    ctx.rotate(rad);

                    const diagonal = Math.sqrt(w * w + h * h);
                    const spacingFactor = tiledSpacing / 50;
                    const stepX = blockWidth + Math.max(60, blockWidth * 0.45 * spacingFactor);
                    const stepY = blockHeight + Math.max(60, blockHeight * 0.55 * spacingFactor);

                    let rowIndex = 0;
                    for (let y = -diagonal; y <= diagonal; y += stepY) {
                        const xOffset = rowIndex % 2 === 0 ? 0 : stepX / 2;
                        for (let x = -diagonal; x <= diagonal; x += stepX) {
                            const posX = x + xOffset;
                            lines.forEach((line, i) => {
                                const posY = y + (i - (lines.length - 1) / 2) * lineHeight;
                                if (hasOutline) ctx.strokeText(line, posX, posY);
                                ctx.fillText(line, posX, posY);
                            });
                        }
                        rowIndex++;
                    }
                } else {
                    // Single Position placement
                    const margin = Math.round(baseDim * 0.05);
                    let cx = w / 2;
                    let cy = h / 2;

                    if (layout === "top-left") {
                        cx = margin + blockWidth / 2;
                        cy = margin + blockHeight / 2;
                    } else if (layout === "top-right") {
                        cx = w - margin - blockWidth / 2;
                        cy = margin + blockHeight / 2;
                    } else if (layout === "bottom-left") {
                        cx = margin + blockWidth / 2;
                        cy = h - margin - blockHeight / 2;
                    } else if (layout === "bottom-right") {
                        cx = w - margin - blockWidth / 2;
                        cy = h - margin - blockHeight / 2;
                    }

                    ctx.translate(cx, cy);
                    ctx.rotate((angle * Math.PI) / 180);

                    lines.forEach((line, i) => {
                        const posY = (i - (lines.length - 1) / 2) * lineHeight;
                        if (hasOutline) ctx.strokeText(line, 0, posY);
                        ctx.fillText(line, 0, posY);
                    });
                }

                ctx.restore();
            } else if (mode === "logo" && logoImg) {
                const targetLogoWidth = Math.max(40, (logoScale / 100) * w);
                const aspect = (logoImg.naturalWidth || 1) / (logoImg.naturalHeight || 1);
                const targetLogoHeight = targetLogoWidth / aspect;

                ctx.save();
                ctx.globalAlpha = logoOpacity;

                if (layout === "tiled") {
                    const rad = (logoAngle * Math.PI) / 180;
                    ctx.translate(w / 2, h / 2);
                    ctx.rotate(rad);

                    const diagonal = Math.sqrt(w * w + h * h);
                    const spacingFactor = tiledSpacing / 50;
                    const stepX = targetLogoWidth + Math.max(50, targetLogoWidth * 0.5 * spacingFactor);
                    const stepY = targetLogoHeight + Math.max(50, targetLogoHeight * 0.6 * spacingFactor);

                    let rowIndex = 0;
                    for (let y = -diagonal; y <= diagonal; y += stepY) {
                        const xOffset = rowIndex % 2 === 0 ? 0 : stepX / 2;
                        for (let x = -diagonal; x <= diagonal; x += stepX) {
                            const posX = x + xOffset - targetLogoWidth / 2;
                            const posY = y - targetLogoHeight / 2;
                            ctx.drawImage(logoImg, posX, posY, targetLogoWidth, targetLogoHeight);
                        }
                        rowIndex++;
                    }
                } else {
                    const margin = Math.round(baseDim * 0.05);
                    let cx = w / 2;
                    let cy = h / 2;

                    if (layout === "top-left") {
                        cx = margin + targetLogoWidth / 2;
                        cy = margin + targetLogoHeight / 2;
                    } else if (layout === "top-right") {
                        cx = w - margin - targetLogoWidth / 2;
                        cy = margin + targetLogoHeight / 2;
                    } else if (layout === "bottom-left") {
                        cx = margin + targetLogoWidth / 2;
                        cy = h - margin - targetLogoHeight / 2;
                    } else if (layout === "bottom-right") {
                        cx = w - margin - targetLogoWidth / 2;
                        cy = h - margin - targetLogoHeight / 2;
                    }

                    ctx.translate(cx, cy);
                    ctx.rotate((logoAngle * Math.PI) / 180);
                    ctx.drawImage(logoImg, -targetLogoWidth / 2, -targetLogoHeight / 2, targetLogoWidth, targetLogoHeight);
                }

                ctx.restore();
            }
        },
        [
            mode,
            watermarkText,
            textColor,
            opacity,
            fontSize,
            angle,
            layout,
            tiledSpacing,
            hasOutline,
            logoImg,
            logoScale,
            logoOpacity,
            logoAngle
        ]
    );

    // Live update preview canvas whenever controls change
    useEffect(() => {
        if (!activeImage || !previewCanvasRef.current) return;

        const canvas = previewCanvasRef.current;
        // Limit preview canvas size for responsive 60fps interaction
        const maxDisplayWidth = 960;
        const scaleFactor = Math.min(1, maxDisplayWidth / activeImage.width);
        const displayWidth = Math.round(activeImage.width * scaleFactor);
        const displayHeight = Math.round(activeImage.height * scaleFactor);

        canvas.width = displayWidth;
        canvas.height = displayHeight;

        renderWatermarkOnCanvas(canvas, activeImage.imgElement, false);
    }, [activeImage, renderWatermarkOnCanvas]);

    // Generate output blob for a given ImageItem at full original resolution
    const generateOutputBlob = async (item: ImageItem): Promise<{ blob: Blob; fileName: string }> => {
        const offscreenCanvas = document.createElement("canvas");
        renderWatermarkOnCanvas(offscreenCanvas, item.imgElement, true);

        let mimeType = item.type;
        let ext = item.name.split(".").pop()?.toLowerCase() || "jpg";

        if (outputFormat === "image/jpeg") {
            mimeType = "image/jpeg";
            ext = "jpg";
        } else if (outputFormat === "image/png") {
            mimeType = "image/png";
            ext = "png";
        } else if (outputFormat === "image/webp") {
            mimeType = "image/webp";
            ext = "webp";
        }

        const q = mimeType === "image/png" ? 1.0 : quality / 100;

        const blob = await new Promise<Blob>((resolve, reject) => {
            offscreenCanvas.toBlob(
                (b) => {
                    if (b) resolve(b);
                    else reject(new Error("Gagal mengonversi canvas ke berkas foto"));
                },
                mimeType,
                q
            );
        });

        const originalBase = item.name.replace(/\.[^/.]+$/, "");
        const finalBase = customFileName.trim()
            ? images.length > 1
                ? `${customFileName.trim()}-${originalBase}`
                : customFileName.trim()
            : `${originalBase}-watermark`;

        const fileName = `${finalBase}.${ext}`;
        return { blob, fileName };
    };

    // Download Single Image
    const handleDownloadSingle = async () => {
        if (!activeImage) return;
        setIsExporting(true);
        setErrorMessage(null);

        try {
            const { blob, fileName } = await generateOutputBlob(activeImage);
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error("Gagal mengunduh foto bertanda air:", err);
            setErrorMessage("Gagal memproses ekspor foto. Silakan coba kembali.");
        } finally {
            setIsExporting(false);
        }
    };

    // Download Batch as ZIP
    const handleDownloadBatchZip = async () => {
        if (images.length === 0) return;
        setIsExporting(true);
        setExportProgress({ current: 0, total: images.length });
        setErrorMessage(null);

        try {
            const zip = new JSZip();

            for (let i = 0; i < images.length; i++) {
                setExportProgress({ current: i + 1, total: images.length });
                const item = images[i];
                const { blob, fileName } = await generateOutputBlob(item);
                zip.file(fileName, blob);
            }

            const zipBlob = await zip.generateAsync({ type: "blob" });
            const zipUrl = URL.createObjectURL(zipBlob);
            const a = document.createElement("a");
            a.href = zipUrl;
            const zipName = customFileName.trim() ? `${customFileName.trim()}.zip` : "foto-watermark-datascry.zip";
            a.download = zipName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(zipUrl);
        } catch (err) {
            console.error("Gagal membuat arsip ZIP:", err);
            setErrorMessage("Gagal membuat arsip ZIP. Coba unduh berkas secara terpisah.");
        } finally {
            setIsExporting(false);
            setExportProgress(null);
        }
    };

    // Open Full-Resolution Lightbox
    const handleOpenLightbox = async () => {
        if (!activeImage) return;
        setIsExporting(true);
        try {
            const { blob, fileName } = await generateOutputBlob(activeImage);
            const url = URL.createObjectURL(blob);
            setLightboxItem({
                url,
                title: fileName,
                width: activeImage.width,
                height: activeImage.height,
                size: blob.size,
                aspectRatio: `${activeImage.width}×${activeImage.height}`
            });
        } catch (err) {
            console.error("Gagal membuka pratinjau HD:", err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8 w-full max-w-5xl mx-auto">
            {/* Hidden native input for adding more images */}
            <input
                ref={fileAddInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        handleFilesAccepted(Array.from(e.target.files));
                    }
                }}
            />

            {/* Hidden native input for logo image */}
            <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoSelected}
            />

            {/* Error Notification */}
            {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start justify-between gap-3 text-rose-400 animate-fade-in shadow-lg">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                        <span className="text-xs sm:text-sm font-semibold">{errorMessage}</span>
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

            {/* Dropzone jika belum ada gambar */}
            {images.length === 0 ? (
                <Dropzone
                    onFilesAccepted={handleFilesAccepted}
                    accept="image/*"
                    title="Tarik & Letakkan Foto atau Scan Dokumen di Sini"
                    description="Mendukung JPG, PNG, WebP, AVIF. Sangat ideal untuk scan KTP, SIM, NPWP, ijazah, foto produk, dan portofolio karya. 100% diproses di browser tanpa kirim ke server."
                    icons={
                        <div className="flex items-center gap-2 text-rose-500 font-semibold text-xs sm:text-sm">
                            <Stamp className="w-5 h-5" />
                            <span>Bisa Unggah Banyak Foto Sekaligus (Batch Watermark)</span>
                        </div>
                    }
                />
            ) : isLoadingImages ? (
                <div className="glass-panel p-12 rounded-3xl border border-border/80 text-center space-y-4 shadow-xl">
                    <Loader2 className="w-10 h-10 animate-spin text-rose-500 mx-auto" />
                    <h3 className="text-lg font-bold text-foreground">Menyiapkan Engine Cap Air...</h3>
                    <p className="text-xs sm:text-sm text-foreground/60">Membaca berkas foto secara lokal di browser Anda...</p>
                </div>
            ) : (
                <div className="space-y-6 sm:space-y-8 animate-fade-in">
                    {/* Top Action Header Bar */}
                    <div className="glass-panel p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-border/80 shadow-xl flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                                <Stamp className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm sm:text-base font-bold text-foreground truncate max-w-45 sm:max-w-xs md:max-w-md">
                                        {activeImage ? activeImage.name : "Daftar Foto"}
                                    </h2>
                                    <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
                                        {images.length} Foto
                                    </span>
                                </div>
                                <p className="text-[11px] sm:text-xs text-foreground/50">
                                    {activeImage ? `${activeImage.width} × ${activeImage.height} px • ${(activeImage.size / (1024 * 1024)).toFixed(2)} MB` : ""}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <button
                                type="button"
                                onClick={() => fileAddInputRef.current?.click()}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-surface/80 hover:bg-surface border border-border/80 hover:border-primary/50 text-foreground transition-all cursor-pointer active:scale-95"
                                title="Tambah foto lain ke antrean"
                            >
                                <Plus className="w-4 h-4 text-primary" />
                                <span>Tambah Foto</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer active:scale-95"
                                title="Reset dan ganti semua foto"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="hidden xs:inline">Reset</span>
                            </button>
                        </div>
                    </div>

                    {/* Thumbnail Strip Gallery jika terdapat lebih dari 1 foto */}
                    {images.length > 1 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-foreground/60 px-1">
                                <span>Pilih foto untuk pratinjau ({activeIdx + 1} dari {images.length}):</span>
                                <span className="text-[11px] text-rose-400 font-medium">Pengaturan cap air berlaku serentak untuk semua foto</span>
                            </div>
                            <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar">
                                {images.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setActiveIdx(idx)}
                                        className={`group relative shrink-0 w-24 sm:w-28 rounded-xl p-1.5 transition-all cursor-pointer border ${
                                            activeIdx === idx
                                                ? "bg-rose-500/10 border-rose-500 ring-2 ring-rose-500/30 scale-102"
                                                : "bg-surface/60 border-border/70 hover:border-border hover:bg-surface"
                                        }`}
                                    >
                                        <div className="w-full h-16 sm:h-18 rounded-lg overflow-hidden bg-black/20 flex items-center justify-center relative">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={item.url}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeImage(item.id);
                                                }}
                                                className="absolute top-1 right-1 p-1 rounded-md bg-black/70 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Hapus foto ini"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <p className="text-[10px] font-medium text-foreground/80 truncate mt-1 text-center">
                                            {item.name}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Preset Banner Cepat (Indonesian Identity Protection Presets) */}
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-foreground/80">
                            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                            <span>Pilih Template Pengaman Cepat (KTP, SIM & Portofolio):</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                            {presets.map((preset, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => applyPreset(preset)}
                                    className="p-2.5 rounded-xl text-left transition-all border bg-surface/40 hover:bg-rose-500/10 hover:border-rose-500/40 border-border/70 group active:scale-97 cursor-pointer flex flex-col justify-between"
                                >
                                    <span className="text-xs font-bold text-foreground group-hover:text-rose-400 block transition-colors leading-tight">
                                        {preset.title}
                                    </span>
                                    <span className="text-[10px] text-foreground/50 line-clamp-1 mt-1 block">
                                        {preset.desc}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Workspace Layout (2 Kolom: Pengaturan & Live Canvas Preview) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Kolom Kiri: Pengaturan Cap Air */}
                        <div className="lg:col-span-5 space-y-5">
                            <div className="glass-panel p-5 rounded-3xl border border-border/80 shadow-xl space-y-5">
                                {/* Mode Switch: Teks vs Logo */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-foreground/70 uppercase tracking-wider block">
                                        Jenis Cap Air (Watermark Mode)
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 p-1 bg-surface/80 rounded-2xl border border-border/70">
                                        <button
                                            type="button"
                                            onClick={() => setMode("text")}
                                            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                                mode === "text"
                                                    ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                                                    : "text-foreground/70 hover:text-foreground hover:bg-surface"
                                            }`}
                                        >
                                            <Type className="w-4 h-4" />
                                            <span>Teks Pengaman</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMode("logo");
                                                if (!logoImg) {
                                                    logoInputRef.current?.click();
                                                }
                                            }}
                                            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                                                mode === "logo"
                                                    ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                                                    : "text-foreground/70 hover:text-foreground hover:bg-surface"
                                            }`}
                                        >
                                            <ImageIcon className="w-4 h-4" />
                                            <span>Stempel Logo PNG</span>
                                        </button>
                                    </div>
                                </div>

                                {mode === "text" ? (
                                    /* Pengaturan Teks */
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-foreground">
                                                    Teks Cap Air (Mendukung Baris Baru)
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setWatermarkText((prev) => `${prev.trim()}\nTGL ${todayFormatted}`);
                                                    }}
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                                                    title="Tambahkan tanggal hari ini ke baris baru"
                                                >
                                                    <Calendar className="w-3 h-3" />
                                                    <span>+ Tanggal Hari Ini</span>
                                                </button>
                                            </div>
                                            <textarea
                                                rows={3}
                                                value={watermarkText}
                                                onChange={(e) => setWatermarkText(e.target.value)}
                                                placeholder="Ketik teks cap air pengaman..."
                                                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-surface/90 border border-border/80 focus:border-rose-500/80 focus:outline-hidden text-foreground placeholder:text-foreground/40 resize-none transition-all"
                                            />
                                        </div>

                                        {/* Warna Cap Air & Outline */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-foreground">Pilihan Warna Teks</span>
                                                <div className="flex items-center gap-1.5">
                                                    <input
                                                        type="color"
                                                        value={textColor}
                                                        onChange={(e) => setTextColor(e.target.value)}
                                                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                                                        title="Pilih warna bebas"
                                                    />
                                                    <span className="text-[10px] font-mono text-foreground/60">{textColor}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                                {COLOR_SWATCHES.map((swatch) => (
                                                    <button
                                                        key={swatch.hex}
                                                        type="button"
                                                        onClick={() => setTextColor(swatch.hex)}
                                                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer border shrink-0 ${
                                                            textColor.toLowerCase() === swatch.hex.toLowerCase()
                                                                ? "ring-2 ring-rose-500 scale-110 shadow-sm"
                                                                : "border-border/80 hover:scale-105"
                                                        }`}
                                                        style={{ backgroundColor: swatch.hex }}
                                                        title={swatch.label}
                                                    >
                                                        {textColor.toLowerCase() === swatch.hex.toLowerCase() && (
                                                            <Check
                                                                className={`w-3.5 h-3.5 ${
                                                                    swatch.hex === "#ffffff" || swatch.hex === "#eab308"
                                                                        ? "text-black"
                                                                        : "text-white"
                                                                }`}
                                                            />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Checkbox Garis Tepi Kontras */}
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-surface/50 border border-border/60">
                                            <div className="space-y-0.5">
                                                <span className="text-xs font-bold text-foreground block">
                                                    Garis Tepi Kontras (Anti-Samar)
                                                </span>
                                                <span className="text-[10px] text-foreground/50 block">
                                                    Teks tetap jelas dibaca di atas foto gelap maupun terang
                                                </span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                id="outline-toggle"
                                                checked={hasOutline}
                                                onChange={(e) => setHasOutline(e.target.checked)}
                                                className="w-4 h-4 rounded text-rose-500 accent-rose-500 cursor-pointer"
                                            />
                                        </div>

                                        {/* Slider Ukuran Teks */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-foreground">Ukuran Teks Relatif</span>
                                                <span className="font-mono text-rose-400 font-semibold">{fontSize}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={15}
                                                max={80}
                                                value={fontSize}
                                                onChange={(e) => setFontSize(Number(e.target.value))}
                                                className="w-full accent-rose-500 cursor-pointer"
                                            />
                                        </div>

                                        {/* Slider Opasitas Teks */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-foreground">Transparansi / Opasitas</span>
                                                <span className="font-mono text-rose-400 font-semibold">
                                                    {Math.round(opacity * 100)}%
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min={0.1}
                                                max={1.0}
                                                step={0.05}
                                                value={opacity}
                                                onChange={(e) => setOpacity(Number(e.target.value))}
                                                className="w-full accent-rose-500 cursor-pointer"
                                            />
                                        </div>

                                        {/* Sudut Kemiringan */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-foreground">Sudut Kemiringan</span>
                                                <span className="font-mono text-rose-400 font-semibold">{angle}°</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={-90}
                                                max={90}
                                                step={5}
                                                value={angle}
                                                onChange={(e) => setAngle(Number(e.target.value))}
                                                className="w-full accent-rose-500 cursor-pointer"
                                            />
                                            <div className="flex items-center gap-1.5 justify-between">
                                                {[-45, -30, 0, 30, 45].map((val) => (
                                                    <button
                                                        key={val}
                                                        type="button"
                                                        onClick={() => setAngle(val)}
                                                        className={`flex-1 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                                                            angle === val
                                                                ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                                                                : "bg-surface/60 text-foreground/70 border-border/60 hover:bg-surface"
                                                        }`}
                                                    >
                                                        {val}°
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Pengaturan Logo */
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-2xl border border-dashed border-border/90 bg-surface/40 text-center space-y-3">
                                            {logoImg ? (
                                                <div className="space-y-3">
                                                    <div className="w-20 h-20 mx-auto rounded-xl bg-black/10 p-2 flex items-center justify-center border border-border/80">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={logoUrl || ""}
                                                            alt="Stempel Logo"
                                                            className="max-w-full max-h-full object-contain"
                                                        />
                                                    </div>
                                                    <div className="text-xs">
                                                        <p className="font-bold text-foreground truncate max-w-xs mx-auto">
                                                            {logoFile?.name}
                                                        </p>
                                                        <p className="text-[10px] text-foreground/50">
                                                            {logoImg.naturalWidth} × {logoImg.naturalHeight} px
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => logoInputRef.current?.click()}
                                                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-surface hover:bg-surface/80 border border-border/80 text-foreground transition-all cursor-pointer"
                                                        >
                                                            Ganti Logo
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (logoUrl) URL.revokeObjectURL(logoUrl);
                                                                setLogoFile(null);
                                                                setLogoUrl(null);
                                                                setLogoImg(null);
                                                            }}
                                                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
                                                        >
                                                            Hapus
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                                                        <Stamp className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-foreground">
                                                            Unggah Stempel Logo PNG Transparan
                                                        </p>
                                                        <p className="text-[11px] text-foreground/50">
                                                            Mendukung PNG, SVG, JPG, atau WebP
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => logoInputRef.current?.click()}
                                                        className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 transition-all cursor-pointer"
                                                    >
                                                        Pilih Berkas Logo
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {logoImg && (
                                            <>
                                                {/* Slider Skala Logo */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-bold text-foreground">Ukuran Logo (% Foto)</span>
                                                        <span className="font-mono text-rose-400 font-semibold">{logoScale}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min={10}
                                                        max={70}
                                                        value={logoScale}
                                                        onChange={(e) => setLogoScale(Number(e.target.value))}
                                                        className="w-full accent-rose-500 cursor-pointer"
                                                    />
                                                </div>

                                                {/* Slider Transparansi Logo */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-bold text-foreground">Opasitas Logo</span>
                                                        <span className="font-mono text-rose-400 font-semibold">
                                                            {Math.round(logoOpacity * 100)}%
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min={0.1}
                                                        max={1.0}
                                                        step={0.05}
                                                        value={logoOpacity}
                                                        onChange={(e) => setLogoOpacity(Number(e.target.value))}
                                                        className="w-full accent-rose-500 cursor-pointer"
                                                    />
                                                </div>

                                                {/* Slider Rotasi Logo */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-bold text-foreground">Rotasi Sudut Logo</span>
                                                        <span className="font-mono text-rose-400 font-semibold">{logoAngle}°</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min={-90}
                                                        max={90}
                                                        step={5}
                                                        value={logoAngle}
                                                        onChange={(e) => setLogoAngle(Number(e.target.value))}
                                                        className="w-full accent-rose-500 cursor-pointer"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Tata Letak / Posisi (Berlaku untuk Teks dan Logo) */}
                                <div className="space-y-2 pt-2 border-t border-border/60">
                                    <label className="text-xs font-bold text-foreground block">
                                        Tata Letak & Penempatan
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setLayout("tiled")}
                                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                                layout === "tiled"
                                                    ? "bg-rose-500/15 border-rose-500 text-rose-400"
                                                    : "bg-surface/50 border-border/70 hover:bg-surface text-foreground/70"
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <LayoutGrid className="w-3.5 h-3.5 text-rose-500" />
                                                <span className="text-xs font-bold">Pola Berulang</span>
                                            </div>
                                            <p className="text-[10px] text-foreground/50 leading-tight">
                                                Tiled grid diagonal anti-crop
                                            </p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setLayout("center")}
                                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                                layout === "center"
                                                    ? "bg-rose-500/15 border-rose-500 text-rose-400"
                                                    : "bg-surface/50 border-border/70 hover:bg-surface text-foreground/70"
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Layers className="w-3.5 h-3.5 text-rose-500" />
                                                <span className="text-xs font-bold">Tengah (Pusat)</span>
                                            </div>
                                            <p className="text-[10px] text-foreground/50 leading-tight">
                                                Stempel tunggal di tengah
                                            </p>
                                        </button>
                                    </div>

                                    {/* 4 Sudut */}
                                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                                        {[
                                            { id: "top-left" as WatermarkLayout, label: "Kiri Atas" },
                                            { id: "top-right" as WatermarkLayout, label: "Kanan Atas" },
                                            { id: "bottom-left" as WatermarkLayout, label: "Kiri Bawah" },
                                            { id: "bottom-right" as WatermarkLayout, label: "Kanan Bawah" }
                                        ].map((corner) => (
                                            <button
                                                key={corner.id}
                                                type="button"
                                                onClick={() => setLayout(corner.id)}
                                                className={`py-1.5 text-[10px] font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                                                    layout === corner.id
                                                        ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                                                        : "bg-surface/40 text-foreground/60 border-border/60 hover:bg-surface"
                                                }`}
                                            >
                                                {corner.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Kerapatan Grid jika Pola Berulang aktif */}
                                    {layout === "tiled" && (
                                        <div className="space-y-1.5 pt-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-medium text-foreground/70">Jarak Spasi Pola</span>
                                                <span className="font-mono text-rose-400 font-semibold">{tiledSpacing}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={20}
                                                max={100}
                                                value={tiledSpacing}
                                                onChange={(e) => setTiledSpacing(Number(e.target.value))}
                                                className="w-full accent-rose-500 cursor-pointer"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Kolom Kanan: Pratinjau Kanvas Interaktif & Opsi Ekspor */}
                        <div className="lg:col-span-7 space-y-5">
                            {/* Panel Canvas Pratinjau */}
                            <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-border/80 shadow-xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Eye className="w-4 h-4 text-rose-500" />
                                        <span className="text-xs sm:text-sm font-bold text-foreground">
                                            Pratinjau Hasil Langsung
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleOpenLightbox}
                                        disabled={isExporting}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-surface/80 hover:bg-surface border border-border/70 hover:border-rose-500/50 text-foreground/80 hover:text-foreground transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                        title="Buka pembesar lightbox resolusi penuh"
                                    >
                                        <ZoomIn className="w-3.5 h-3.5 text-rose-500" />
                                        <span>Intip HD (Zoom)</span>
                                    </button>
                                </div>

                                {/* Area Canvas */}
                                <div className="w-full rounded-2xl bg-black/40 border border-border/80 p-2 sm:p-3 overflow-hidden flex items-center justify-center min-h-65 sm:min-h-90">
                                    <canvas
                                        ref={previewCanvasRef}
                                        className="max-w-full max-h-115 object-contain rounded-xl shadow-lg shadow-black/40"
                                    />
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-foreground/50 px-1">
                                    <span>Pratinjau interaktif real-time</span>
                                    <span>Ekspor akhir akan menggunakan resolusi penuh 100% tanpa kompresi pixel</span>
                                </div>
                            </div>

                            {/* Panel Pengaturan Ekspor & Tombol Unduh */}
                            <div className="glass-panel p-5 rounded-3xl border border-border/80 shadow-xl space-y-4">
                                <div className="flex items-center gap-2">
                                    <Sliders className="w-4 h-4 text-rose-500" />
                                    <span className="text-xs sm:text-sm font-bold text-foreground">
                                        Format Ekspor & Penamaan
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Format Ekspor */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-foreground/70 block">
                                            Format Berkas Hasil
                                        </label>
                                        <select
                                            value={outputFormat}
                                            onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                                            className="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border/80 text-foreground focus:border-rose-500 focus:outline-hidden cursor-pointer"
                                        >
                                            <option value="original">Sesuai Format Asli (Rekomendasi)</option>
                                            <option value="image/jpeg">JPG / JPEG (Standar Universal)</option>
                                            <option value="image/png">PNG (Tajam Tanpa Rugi / Lossless)</option>
                                            <option value="image/webp">WebP (Modern & Hemat Ukuran)</option>
                                        </select>
                                    </div>

                                    {/* Kustom Nama Berkas */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-foreground/70 block">
                                            Nama Berkas Unduhan
                                        </label>
                                        <input
                                            type="text"
                                            value={customFileName}
                                            onChange={(e) => setCustomFileName(e.target.value)}
                                            placeholder="Nama berkas..."
                                            className="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border/80 text-foreground focus:border-rose-500 focus:outline-hidden"
                                        />
                                    </div>
                                </div>

                                {/* Action Download Buttons */}
                                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                    {/* Download Foto Aktif */}
                                    <button
                                        type="button"
                                        onClick={handleDownloadSingle}
                                        disabled={isExporting}
                                        className="flex-1 py-3 px-4 rounded-2xl bg-rose-500 hover:bg-rose-600 active:scale-98 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {isExporting && !exportProgress ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Memproses Foto HD...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4" />
                                                <span>
                                                    {images.length > 1
                                                        ? "Unduh Foto Ini Saja (HD)"
                                                        : "Unduh Foto Bertanda Air (HD)"}
                                                </span>
                                            </>
                                        )}
                                    </button>

                                    {/* Download Semua (Batch ZIP) */}
                                    {images.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={handleDownloadBatchZip}
                                            disabled={isExporting}
                                            className="flex-1 py-3 px-4 rounded-2xl bg-surface hover:bg-surface/80 active:scale-98 border border-border/80 hover:border-rose-500/50 text-foreground font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                        >
                                            {isExporting && exportProgress ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                                                    <span>
                                                        Memproses {exportProgress.current} / {exportProgress.total}...
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <FolderArchive className="w-4 h-4 text-rose-500" />
                                                    <span>Unduh Semua ({images.length} Foto .ZIP)</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox Modal untuk inspeksi resolusi penuh dengan zoom & pan */}
            <MediaLightboxModal
                isOpen={!!lightboxItem}
                onClose={() => setLightboxItem(null)}
                item={lightboxItem}
                accentColor="rose"
                downloadLabel="Unduh Foto HD"
                onDownload={handleDownloadSingle}
            />
        </div>
    );
}
