"use client";

import { useState, useRef, useEffect } from "react";
import Dropzone from "@/components/ui/Dropzone";
import { PDFDocument } from "pdf-lib";
import { 
    Settings2, 
    Trash2, 
    ChevronLeft, 
    ChevronRight, 
    ChevronDown,
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
    Check,
    RotateCcw,
    Eye,
    ExternalLink,
    ZoomIn,
    ZoomOut,
    X
} from "lucide-react";

type PageMode = "document" | "fit";
type PageSizeOption = "f4" | "a4" | "letter" | "fit";
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
    f4: { width: 609.45, height: 935.43, label: "F4 / Folio (Standar Indonesia - 215×330mm)" },
    a4: { width: 595.28, height: 841.89, label: "A4 (Standar Dokumen - 210×297mm)" },
    letter: { width: 612.0, height: 792.0, label: "US Letter (216×279mm)" },
    fit: { width: 0, height: 0, label: "Sesuai Ukuran Asli Gambar (Proporsional)" },
};

const MARGIN_SIZES = {
    none: { size: 0, label: "Tanpa Margin (Penuh / 0 mm)" },
    small: { size: 15, label: "Margin Rapi (5 mm)" },
    normal: { size: 30, label: "Margin Lebar (10 mm)" },
};

interface CustomSelectOption<T extends string> {
    value: T;
    label: string;
    description?: string;
}

interface CustomSelectProps<T extends string> {
    label: string;
    icon: React.ReactNode;
    value: T;
    options: CustomSelectOption<T>[];
    onChange: (value: T) => void;
    id: string;
    activeDropdown: string | null;
    setActiveDropdown: (id: string | null) => void;
}

function CustomSelect<T extends string>({
    label,
    icon,
    value,
    options,
    onChange,
    id,
    activeDropdown,
    setActiveDropdown,
}: CustomSelectProps<T>) {
    const isOpen = activeDropdown === id;
    const selectedOption = options.find((o) => o.value === value) || options[0];

    return (
        <div className="space-y-1.5 relative">
            <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5 select-none">
                {icon}
                {label}
            </label>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setActiveDropdown(isOpen ? null : id)}
                    className={`w-full px-3 py-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isOpen
                            ? "bg-surface border-amber-500 ring-2 ring-amber-500/20 shadow-md text-foreground"
                            : "bg-surface/80 hover:bg-surface border-border/80 hover:border-amber-500/40 text-foreground/90"
                    }`}
                >
                    <span className="truncate">{selectedOption?.label}</span>
                    <ChevronDown
                        className={`w-3.5 h-3.5 text-foreground/40 shrink-0 transition-transform duration-200 ${
                            isOpen ? "rotate-180 text-amber-500" : ""
                        }`}
                    />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1.5 min-w-52.5 p-1.5 rounded-2xl bg-neutral-900/95 backdrop-blur-xl border border-border/80 shadow-2xl space-y-1 animate-fade-in">
                        {options.map((opt) => {
                            const isSelected = opt.value === value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value);
                                        setActiveDropdown(null);
                                    }}
                                    className={`w-full px-3 py-2 rounded-xl text-left text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                                        isSelected
                                            ? "bg-amber-500/15 text-amber-400 font-semibold"
                                            : "text-foreground/80 hover:bg-surface/80 hover:text-foreground font-normal"
                                    }`}
                                >
                                    <div className="truncate">
                                        <div className="truncate">{opt.label}</div>
                                        {opt.description && (
                                            <div className="text-[10px] text-foreground/50">{opt.description}</div>
                                        )}
                                    </div>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ClientJpgToPdf() {
    const [images, setImages] = useState<ImageMeta[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState<string>("");
    const [completePdf, setCompletePdf] = useState<Blob | null>(null);

    // Primary Layout Mode
    // "document" = Fixed paper size like F4/A4 (for official documents, printing & clean bounds)
    // "fit" = Seamless proportional matching exact image aspect ratio without oversized dimensions
    const [pageMode, setPageMode] = useState<PageMode>("document");

    // Detailed Settings
    const [pageSize, setPageSize] = useState<PageSizeOption>("f4");
    const [orientation, setOrientation] = useState<OrientationOption>("auto");
    const [margin, setMargin] = useState<MarginOption>("none");
    const [imageFit, setImageFit] = useState<ImageFitOption>("contain");

    // Active dropdown state for custom selects
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const dropdownContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (dropdownContainerRef.current && !dropdownContainerRef.current.contains(e.target as Node)) {
                setActiveDropdown(null);
            }
        };
        if (activeDropdown) {
            document.addEventListener("mousedown", handleOutsideClick);
        }
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [activeDropdown]);

    // Notification banner
    const [autoDetectNotice, setAutoDetectNotice] = useState<string | null>(null);

    // Pratinjau PDF Hasil Konversi
    const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

    // Pratinjau Foto/Gambar Terpilih (Lightbox Modal) & Zoom State
    const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);
    const [imageZoom, setImageZoom] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);
    const lightboxBodyRef = useRef<HTMLDivElement>(null);

    const handleZoomIn = () => {
        setImageZoom((prev) => Math.min(4, Math.round((prev + 0.25) * 100) / 100));
    };

    const handleZoomOut = () => {
        setImageZoom((prev) => {
            const next = Math.max(0.5, Math.round((prev - 0.25) * 100) / 100);
            if (next <= 1) setPanOffset({ x: 0, y: 0 });
            return next;
        });
    };

    const handleResetZoom = () => {
        setImageZoom(1);
        setPanOffset({ x: 0, y: 0 });
    };

    const handleToggleZoom = () => {
        if (imageZoom !== 1) {
            handleResetZoom();
        } else {
            setImageZoom(2);
        }
    };

    const openImagePreview = (index: number) => {
        setPreviewImageIndex(index);
        handleResetZoom();
    };

    const closeLightbox = () => {
        setPreviewImageIndex(null);
        handleResetZoom();
    };

    const goToPrevImage = () => {
        if (previewImageIndex !== null && previewImageIndex > 0) {
            setPreviewImageIndex(previewImageIndex - 1);
            handleResetZoom();
        }
    };

    const goToNextImage = () => {
        if (previewImageIndex !== null && previewImageIndex < images.length - 1) {
            setPreviewImageIndex(previewImageIndex + 1);
            handleResetZoom();
        }
    };

    // Zooming via mouse wheel over image container
    useEffect(() => {
        const el = lightboxBodyRef.current;
        if (!el || previewImageIndex === null) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.deltaY < 0) {
                setImageZoom((prev) => Math.min(4, Math.round((prev + 0.25) * 100) / 100));
            } else {
                setImageZoom((prev) => {
                    const next = Math.max(0.5, Math.round((prev - 0.25) * 100) / 100);
                    if (next <= 1) setPanOffset({ x: 0, y: 0 });
                    return next;
                });
            }
        };

        el.addEventListener("wheel", onWheel, { passive: false });
        return () => {
            el.removeEventListener("wheel", onWheel);
        };
    }, [previewImageIndex]);

    // Navigasi keyboard Escape, Panah Kiri/Kanan, Zoom (+, -, 0)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsPdfModalOpen(false);
                closeLightbox();
            } else if (previewImageIndex !== null) {
                if (e.key === "ArrowLeft" && previewImageIndex > 0) {
                    goToPrevImage();
                } else if (e.key === "ArrowRight" && previewImageIndex < images.length - 1) {
                    goToNextImage();
                } else if (e.key === "+" || e.key === "=") {
                    e.preventDefault();
                    handleZoomIn();
                } else if (e.key === "-" || e.key === "_") {
                    e.preventDefault();
                    handleZoomOut();
                } else if (e.key === "0") {
                    e.preventDefault();
                    handleResetZoom();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [previewImageIndex, images.length, imageZoom]);

    // Mouse and Touch dragging handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (imageZoom > 1 && e.button === 0) {
            e.preventDefault();
            setIsDragging(true);
            dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || imageZoom <= 1) return;
        e.preventDefault();
        setPanOffset({
            x: e.clientX - dragStartRef.current.x,
            y: e.clientY - dragStartRef.current.y,
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (imageZoom > 1 && e.touches.length === 1) {
            touchStartRef.current = {
                x: e.touches[0].clientX - panOffset.x,
                y: e.touches[0].clientY - panOffset.y,
            };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (imageZoom > 1 && touchStartRef.current && e.touches.length === 1) {
            setPanOffset({
                x: e.touches[0].clientX - touchStartRef.current.x,
                y: e.touches[0].clientY - touchStartRef.current.y,
            });
        }
    };

    const handleTouchEnd = () => {
        touchStartRef.current = null;
    };

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
            setPageSize("f4");
            setMargin("none");
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
                    // MODE PAS UKURAN ASLI GAMBAR (PROPORSIONAL DOKUMEN / BORDERLESS)
                    // Jika 1px dijadikan 1pt langsung tanpa batas, foto kamera/screenshot resolusi tinggi
                    // (misal 4000x3000px) menghasilkan halaman PDF fisik berukuran 1.4 meter x 1 meter (sangat besar).
                    // Kita batasi dimensi halaman fisik agar proporsional dalam batas dokumen standar (maksimal bounded setara F4/Folio: 609.45 x 935.43 pt).
                    // Gambar tetap di-embed utuh dengan resolusi asli gambar penuh (100% tajam tanpa kompresi),
                    // sehingga saat dibuka atau dicetak, ukuran fisik halaman normal dan ketajaman gambar sempurna!
                    const maxBoundW = 609.45;
                    const maxBoundH = 935.43;
                    const isImgLandscape = imgWidth > imgHeight;

                    const limitW = isImgLandscape ? Math.max(maxBoundW, maxBoundH) : Math.min(maxBoundW, maxBoundH);
                    const limitH = isImgLandscape ? Math.min(maxBoundW, maxBoundH) : Math.max(maxBoundW, maxBoundH);

                    const scaleFactor = Math.min(limitW / imgWidth, limitH / imgHeight, 1);
                    const boundedW = imgWidth * scaleFactor;
                    const boundedH = imgHeight * scaleFactor;

                    pageW = boundedW + (marginSize * 2);
                    pageH = boundedH + (marginSize * 2);

                    drawW = boundedW;
                    drawH = boundedH;
                    x = marginSize;
                    y = marginSize;
                } else {
                    // MODE STANDAR DOKUMEN (F4 / A4 / Letter)
                    const base = PAGE_DIMENSIONS[pageSize as "f4" | "a4" | "letter"] || PAGE_DIMENSIONS.f4;
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
        setIsPdfModalOpen(false);
        setPreviewImageIndex(null);
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
                            <div className="glass-panel p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-border/80 space-y-5 sm:space-y-6 shadow-xl">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
                                    <div className="flex items-center gap-2">
                                        <Settings2 className="w-5 h-5 text-amber-500 shrink-0" />
                                        <h3 className="font-bold text-foreground text-sm sm:text-base md:text-lg">
                                            Format & Ukuran Halaman PDF
                                        </h3>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-3">
                                        <span className="text-xs text-foreground/60 hidden md:inline">
                                            Pilih bagaimana gambar disesuaikan pada halaman PDF
                                        </span>
                                        <button
                                            type="button"
                                            onClick={resetState}
                                            className="text-xs text-foreground/50 hover:text-rose-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                                            title="Reset semua pilihan dan ganti berkas"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            <span>Ganti / Reset Berkas</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Mode Pilihan Cepat: Pas Ukuran Asli vs Kertas Dokumen */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                                    <button
                                        type="button"
                                        onClick={() => handleSwitchMode("fit")}
                                        className={`p-4 sm:p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between group cursor-pointer ${
                                            pageMode === "fit"
                                                ? "bg-amber-500/10 border-amber-500/60 shadow-lg text-foreground ring-1 ring-amber-500/30"
                                                : "bg-surface/50 border-border/60 hover:bg-surface text-foreground/70"
                                        }`}
                                    >
                                        <div className="space-y-2.5">
                                            <div className="flex items-start justify-between gap-2.5">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className={`p-2 sm:p-2.5 rounded-xl transition-colors shrink-0 ${pageMode === "fit" ? "bg-amber-500/20 text-amber-400" : "bg-surface text-foreground/50"}`}>
                                                        <Monitor className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="font-bold text-sm sm:text-base text-foreground block leading-snug">
                                                            Pas Ukuran Asli Gambar
                                                        </span>
                                                        <span className="text-[11px] sm:text-xs text-amber-400 font-medium block mt-0.5">
                                                            1:1 Skala Resolusi Penuh
                                                        </span>
                                                    </div>
                                                </div>

                                                <span className="hidden sm:inline-flex text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-surface border border-border/80 text-foreground/60 font-medium shrink-0">
                                                    Proporsional Asli
                                                </span>
                                            </div>

                                            {/* Badge versi mobile yang rapi tanpa mendesak judul */}
                                            <div className="sm:hidden flex items-center gap-1.5">
                                                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-surface border border-border/80 text-foreground/60 font-medium">
                                                    Proporsional Asli
                                                </span>
                                            </div>

                                            <p className="text-xs text-foreground/60 leading-relaxed">
                                                Ukuran halaman PDF proporsional mengikuti rasio asli gambar tanpa bingkai putih (borderless), dengan batas dimensi dokumen wajar dan resolusi tajam asli.
                                            </p>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                                            <span className="text-foreground/50 text-[11px] sm:text-xs">Cocok untuk: Foto HD, screenshot tanpa border putih</span>
                                            {pageMode === "fit" && (
                                                <span className="inline-flex items-center gap-1 text-amber-400 font-semibold shrink-0 ml-2">
                                                    <Check className="w-3.5 h-3.5" />
                                                    Aktif
                                                </span>
                                            )}
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleSwitchMode("document")}
                                        className={`p-4 sm:p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between group cursor-pointer ${
                                            pageMode === "document"
                                                ? "bg-amber-500/10 border-amber-500/60 shadow-lg text-foreground ring-1 ring-amber-500/30"
                                                : "bg-surface/50 border-border/60 hover:bg-surface text-foreground/70"
                                        }`}
                                    >
                                        <div className="space-y-2.5">
                                            <div className="flex items-start justify-between gap-2.5">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className={`p-2 sm:p-2.5 rounded-xl transition-colors shrink-0 ${pageMode === "document" ? "bg-amber-500/20 text-amber-400" : "bg-surface text-foreground/50"}`}>
                                                        <Layers className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="font-bold text-sm sm:text-base text-foreground block leading-snug">
                                                            Kertas Standar Dokumen
                                                        </span>
                                                        <span className="text-[11px] sm:text-xs text-foreground/50 font-medium block mt-0.5">
                                                            Format Cetak Fisik & Administrasi
                                                        </span>
                                                    </div>
                                                </div>

                                                <span className="hidden sm:inline-flex text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30 shrink-0">
                                                    ★ Rekomendasi (F4 / A4)
                                                </span>
                                            </div>

                                            {/* Badge versi mobile */}
                                            <div className="sm:hidden flex items-center gap-1.5">
                                                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                                                    ★ Rekomendasi (F4 / A4)
                                                </span>
                                            </div>

                                            <p className="text-xs text-foreground/60 leading-relaxed">
                                                Membungkus gambar ke ukuran kertas fisik standar (<strong>F4 Folio</strong> atau <strong>A4</strong>) untuk dicetak ke printer fisik atau arsip administrasi resmi.
                                            </p>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                                            <span className="text-foreground/50 text-[11px] sm:text-xs">Cocok untuk: Cetak printer kertas nyata, berkas kantor & kampus</span>
                                            {pageMode === "document" && (
                                                <span className="inline-flex items-center gap-1 text-amber-400 font-semibold shrink-0 ml-2">
                                                    <Check className="w-3.5 h-3.5" />
                                                    Aktif
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                </div>

                                {/* Opsi Detail jika Mode Kertas Dokumen Dipilih */}
                                {pageMode === "document" && (
                                    <div className="space-y-3 animate-fade-in">
                                        <div 
                                            ref={dropdownContainerRef}
                                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 sm:p-5 rounded-2xl bg-surface/60 border border-border/60"
                                        >
                                            {/* 1. Ukuran Kertas */}
                                            <CustomSelect
                                                id="pageSize"
                                                label="Ukuran Kertas"
                                                icon={<FileText className="w-3.5 h-3.5 text-amber-500" />}
                                                value={pageSize}
                                                options={[
                                                    { value: "f4", label: "F4 / Folio (215 × 330 mm)", description: "Standar Dokumen Indonesia & HVS" },
                                                    { value: "a4", label: "A4 (210 × 297 mm)", description: "Standar Dokumen & Surat Internasional" },
                                                    { value: "letter", label: "US Letter (216 × 279 mm)", description: "Standar Internasional AS" },
                                                ]}
                                                onChange={(val) => setPageSize(val as PageSizeOption)}
                                                activeDropdown={activeDropdown}
                                                setActiveDropdown={setActiveDropdown}
                                            />

                                            {/* 2. Orientasi */}
                                            <CustomSelect
                                                id="orientation"
                                                label="Orientasi Halaman"
                                                icon={<Compass className="w-3.5 h-3.5 text-amber-500" />}
                                                value={orientation}
                                                options={[
                                                    { value: "auto", label: "Otomatis Sesuai Foto", description: "Otomatis potret atau lanskap" },
                                                    { value: "landscape", label: "Paksa Lanskap (Mendatar)", description: "Lebar lebih panjang dari tinggi" },
                                                    { value: "portrait", label: "Paksa Potret (Tegak)", description: "Tinggi lebih panjang dari lebar" },
                                                ]}
                                                onChange={(val) => setOrientation(val as OrientationOption)}
                                                activeDropdown={activeDropdown}
                                                setActiveDropdown={setActiveDropdown}
                                            />

                                            {/* 3. Gaya Penyesuaian Gambar */}
                                            <CustomSelect
                                                id="imageFit"
                                                label="Penataan Gambar"
                                                icon={<Maximize2 className="w-3.5 h-3.5 text-amber-500" />}
                                                value={imageFit}
                                                options={[
                                                    { value: "contain", label: "Paskan Gambar (Utuh)", description: "Seluruh foto terlihat tanpa terpotong" },
                                                    { value: "cover", label: "Penuhi Kertas (Cover)", description: "Penuh sampai tepi tanpa border putih" },
                                                ]}
                                                onChange={(val) => setImageFit(val as ImageFitOption)}
                                                activeDropdown={activeDropdown}
                                                setActiveDropdown={setActiveDropdown}
                                            />

                                            {/* 4. Margin */}
                                            <CustomSelect
                                                id="margin"
                                                label="Batas Tepi (Margin)"
                                                icon={<Maximize2 className="w-3.5 h-3.5 text-amber-500" />}
                                                value={margin}
                                                options={[
                                                    { value: "none", label: "Tanpa Margin (0 mm)", description: "Penuh sampai ujung kertas" },
                                                    { value: "small", label: "Margin Rapi (5 mm)", description: "Batas aman cetak printer" },
                                                    { value: "normal", label: "Margin Lebar (10 mm)", description: "Ruang untuk staples / jilid" },
                                                ]}
                                                onChange={(val) => setMargin(val as MarginOption)}
                                                activeDropdown={activeDropdown}
                                                setActiveDropdown={setActiveDropdown}
                                            />
                                        </div>

                                        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
                                            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                            <div className="leading-relaxed">
                                                <span className="font-semibold text-blue-200">Format Kertas F4 (Folio):</span> Ukuran F4 (21,5 × 33 cm) adalah standar kertas dokumen resmi, fotokopi, dan lembar kerja di Indonesia. Gambar Anda akan dibungkus pas ke ukuran halaman F4 dengan resolusi tinggi yang jernih saat dicetak.
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Header List Gambar & Tombol Proses */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                            Foto Terpilih ({images.length})
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={resetState}
                                            disabled={isProcessing}
                                            className="px-3 py-1 rounded-full text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                                            title="Hapus semua foto yang telah dipilih"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Clear Semua</span>
                                        </button>
                                    </div>
                                    <p className="text-xs text-foreground/60 mt-0.5">
                                        Gunakan tombol panah untuk mengatur urutan halaman pada dokumen PDF Anda.
                                    </p>
                                </div>

                                <button
                                    onClick={generatePDF}
                                    disabled={isProcessing}
                                    className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
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

                                        {/* Tombol Aksi: Pratinjau & Hapus */}
                                        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => openImagePreview(idx)}
                                                className="p-1.5 bg-black/75 hover:bg-amber-500 text-white rounded-lg transition-all hover:scale-110 shadow-sm cursor-pointer"
                                                title="Pratinjau foto ini (Layar Penuh)"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className="p-1.5 bg-rose-500/90 hover:bg-rose-600 text-white rounded-lg transition-transform hover:scale-110 shadow-sm cursor-pointer"
                                                title="Hapus foto ini"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Preview Gambar (Dapat diklik untuk memperbesar) */}
                                        <div 
                                            onClick={() => openImagePreview(idx)}
                                            className="flex-1 relative overflow-hidden flex items-center justify-center bg-black/40 cursor-zoom-in group/img"
                                            title="Klik untuk melihat pratinjau penuh"
                                        >
                                            <img
                                                src={item.previewUrl}
                                                alt={item.file.name}
                                                className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover/img:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-xs">
                                                <Eye className="w-4 h-4 text-amber-400" />
                                                <span>Pratinjau</span>
                                            </div>
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
                /* Sukses & Pratinjau PDF State */
                <div className="space-y-8 max-w-4xl mx-auto mt-6 animate-fade-in">
                    <div className="p-8 sm:p-10 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-6 glass-panel shadow-2xl">
                        <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-2 shadow-inner">
                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                                PDF Siap Digunakan!
                            </h3>
                            <p className="text-foreground/70 text-base max-w-lg mx-auto">
                                {pageMode === "fit" ? (
                                    <span>Dokumen PDF Anda telah disesuaikan <strong>1:1 sesuai resolusi asli gambar tanpa border putih</strong>.</span>
                                ) : (
                                    <span>Dokumen PDF Anda telah diselaraskan ke ukuran kertas standar <strong>{pageSize.toUpperCase()}</strong> siap cetak.</span>
                                )}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2 w-full">
                            <button
                                onClick={handleDownload}
                                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
                            >
                                <Download className="w-5 h-5" />
                                <span>Unduh PDF ({(completePdf.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </button>

                            <button
                                onClick={() => setIsPdfModalOpen(true)}
                                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
                            >
                                <Eye className="w-5 h-5" />
                                <span>Pratinjau Layar Penuh</span>
                            </button>
                            
                            <button
                                onClick={resetState}
                                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-surface hover:bg-surface/80 text-foreground font-bold transition-all border border-border hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>Konversi Berkas Lain</span>
                            </button>
                        </div>
                    </div>

                    {/* Pratinjau Dokumen PDF Tersemat (Live Embedded Preview) */}
                    {previewPdfUrl && (
                        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-border/80 space-y-4 shadow-2xl animate-fade-in">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground text-base sm:text-lg">
                                            Pratinjau Dokumen PDF
                                        </h3>
                                        <p className="text-xs text-foreground/60">
                                            Total {images.length} Halaman • {(completePdf.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <a
                                        href={previewPdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3.5 py-2 rounded-xl bg-surface hover:bg-surface/80 border border-border text-xs font-semibold text-foreground/80 hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
                                        title="Buka dokumen PDF di tab baru peramban"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                                        <span>Buka Tab Baru</span>
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => setIsPdfModalOpen(true)}
                                        className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-semibold text-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                                        title="Perbesar tampilan pratinjau ke layar penuh"
                                    >
                                        <Maximize2 className="w-3.5 h-3.5" />
                                        <span>Layar Penuh</span>
                                    </button>
                                </div>
                            </div>

                            {/* Frame PDF */}
                            <div className="w-full h-150 sm:h-175 rounded-2xl overflow-hidden border border-border/60 bg-neutral-950 shadow-inner relative">
                                <iframe
                                    src={`${previewPdfUrl}#toolbar=1&navpanes=0`}
                                    className="w-full h-full border-0"
                                    title="Pratinjau PDF Hasil Konversi"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Pratinjau Foto Asli (Image Lightbox Modal) */}
            {previewImageIndex !== null && images[previewImageIndex] && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) closeLightbox();
                    }}
                >
                    <div className="relative w-full max-w-5xl bg-neutral-900/95 border border-border/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[94vh]">
                        {/* Header Lightbox */}
                        <div className="p-3 sm:p-4 sm:px-6 border-b border-border/50 flex items-center justify-between gap-2 sm:gap-4">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 shrink-0">
                                    Hal {previewImageIndex + 1} dari {images.length}
                                </span>
                                <span className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-28 sm:max-w-xs md:max-w-md">
                                    {images[previewImageIndex].file.name}
                                </span>
                                <span className="text-xs text-foreground/50 hidden md:inline shrink-0">
                                    ({images[previewImageIndex].width} × {images[previewImageIndex].height} px • {(images[previewImageIndex].file.size / 1024).toFixed(0)} KB)
                                </span>
                            </div>

                            {/* Toolbar Kontrol Zoom & Tutup */}
                            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                                <div className="flex items-center bg-surface/80 border border-border/70 rounded-xl p-0.5 sm:p-1 shadow-inner">
                                    <button
                                        type="button"
                                        onClick={handleZoomOut}
                                        disabled={imageZoom <= 0.5}
                                        className="p-1 sm:p-1.5 rounded-lg hover:bg-surface text-foreground/70 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                                        title="Perkecil Zoom (-)"
                                    >
                                        <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleResetZoom}
                                        className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg hover:bg-surface text-[11px] sm:text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                                        title="Reset Zoom ke 100% (Tekan 0)"
                                    >
                                        {Math.round(imageZoom * 100)}%
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleZoomIn}
                                        disabled={imageZoom >= 4}
                                        className="p-1 sm:p-1.5 rounded-lg hover:bg-surface text-foreground/70 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                                        title="Perbesar Zoom (+)"
                                    >
                                        <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeLightbox}
                                    className="p-1.5 sm:p-2 rounded-xl bg-surface/80 hover:bg-surface text-foreground/60 hover:text-foreground border border-border/60 transition-colors cursor-pointer shrink-0"
                                    title="Tutup (Esc)"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Body Lightbox (Foto Besar, Zoom & Navigasi) */}
                        <div 
                            ref={lightboxBodyRef}
                            className="flex-1 overflow-hidden p-2 sm:p-6 flex items-center justify-center bg-black/75 relative select-none"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            <div
                                className="transition-transform duration-100 ease-out origin-center flex items-center justify-center will-change-transform"
                                style={{
                                    transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${imageZoom})`,
                                    cursor: imageZoom > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
                                }}
                                onDoubleClick={handleToggleZoom}
                                title={imageZoom > 1 ? "Tahan & geser untuk melihat area lain, klik ganda untuk reset" : "Klik ganda untuk memperbesar (2x)"}
                            >
                                <img
                                    src={images[previewImageIndex].previewUrl}
                                    alt={images[previewImageIndex].file.name}
                                    className="max-h-[72vh] w-auto max-w-full object-contain rounded-none shadow-2xl pointer-events-none"
                                    draggable={false}
                                />
                            </div>

                            {/* Floating Reset Zoom Badge saat di-zoom */}
                            {imageZoom !== 1 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/90 backdrop-blur-md border border-amber-500/40 text-white text-xs shadow-2xl animate-fade-in">
                                    <span className="font-medium text-amber-400">Zoom: {Math.round(imageZoom * 100)}%</span>
                                    <button
                                        type="button"
                                        onClick={handleResetZoom}
                                        className="px-2 py-0.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                        title="Kembalikan ke ukuran normal"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>Reset</span>
                                    </button>
                                </div>
                            )}

                            {/* Navigasi Panah Kiri */}
                            {previewImageIndex > 0 && (
                                <button
                                    type="button"
                                    onClick={goToPrevImage}
                                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-black/75 hover:bg-amber-500 text-white border border-white/20 transition-all hover:scale-110 shadow-xl cursor-pointer"
                                    title="Halaman Sebelumnya (Panah Kiri)"
                                >
                                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            )}

                            {/* Navigasi Panah Kanan */}
                            {previewImageIndex < images.length - 1 && (
                                <button
                                    type="button"
                                    onClick={goToNextImage}
                                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-black/75 hover:bg-amber-500 text-white border border-white/20 transition-all hover:scale-110 shadow-xl cursor-pointer"
                                    title="Halaman Berikutnya (Panah Kanan)"
                                >
                                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            )}
                        </div>

                        {/* Footer Lightbox */}
                        <div className="p-2.5 sm:p-3 sm:px-6 border-t border-border/50 bg-surface/50 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs text-foreground/60">
                            <span className="hidden sm:inline">Tips: Scroll mouse / klik ganda untuk zoom • Geser untuk navigasi • ⬅ ➡ untuk ganti halaman • Esc untuk keluar</span>
                            <span className="sm:hidden text-[11px]">Ketuk 2x untuk zoom • Geser untuk memindahkan</span>
                            <span className="text-[11px] sm:text-xs">Format: {formatRatio(images[previewImageIndex].aspectRatio)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Pratinjau PDF Layar Penuh (Full-screen PDF Modal) */}
            {isPdfModalOpen && previewPdfUrl && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsPdfModalOpen(false);
                    }}
                >
                    <div className="relative w-full max-w-6xl h-[94vh] bg-neutral-900/95 border border-border/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                        {/* Header Modal PDF */}
                        <div className="p-4 sm:px-6 border-b border-border/50 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground text-sm sm:text-base">
                                        Pratinjau Dokumen PDF
                                    </h4>
                                    <p className="text-[11px] text-foreground/50">
                                        {images.length} Halaman • {completePdf ? (completePdf.size / 1024 / 1024).toFixed(2) : 0} MB
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <a
                                    href={previewPdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface/80 border border-border text-xs font-semibold text-foreground/80 hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                                    <span className="hidden sm:inline">Buka Tab Baru</span>
                                </a>
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Unduh PDF</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsPdfModalOpen(false)}
                                    className="p-1.5 rounded-xl bg-surface/80 hover:bg-surface text-foreground/60 hover:text-foreground border border-border/60 transition-colors cursor-pointer"
                                    title="Tutup (Esc)"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Body Modal PDF */}
                        <div className="flex-1 w-full bg-neutral-950 relative">
                            <iframe
                                src={`${previewPdfUrl}#toolbar=1&navpanes=0`}
                                className="w-full h-full border-0"
                                title="Pratinjau PDF Penuh"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
