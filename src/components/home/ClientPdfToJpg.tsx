"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Dropzone from "@/components/ui/Dropzone";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";
import JSZip from "jszip";
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
    Monitor,
    Layers,
    Info,
    Check,
    RotateCcw,
    Eye,
    ExternalLink,
    ZoomIn,
    ZoomOut,
    CheckSquare,
    Square,
    Image as ImageIcon,
    Sliders,
    X,
    Filter,
    AlertCircle
} from "lucide-react";

// Setup PDF.js worker using local public worker for 100% offline & reliable loading
if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

type OutputFormat = "jpg" | "png" | "webp";
type RenderQuality = "standard" | "high" | "ultra";
type PageSelectionMode = "all" | "selected" | "range";

interface PageMeta {
    pageNumber: number;
    thumbnailUrl: string;
    width: number;
    height: number;
    aspectRatio: number;
    isSelected: boolean;
}

interface ExtractedImage {
    pageNumber: number;
    fileName: string;
    blob: Blob;
    url: string;
    width: number;
    height: number;
    aspectRatio: number;
    size: number;
}

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
                    <div className="absolute top-full left-0 right-0 z-50 mt-1.5 min-w-56 p-1.5 rounded-2xl bg-neutral-900/95 backdrop-blur-xl border border-border/80 shadow-2xl space-y-1 animate-fade-in">
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

function formatRatio(ratio: number): string {
    if (Math.abs(ratio - 16 / 9) < 0.08) return "16:9 (Layar Lebar)";
    if (Math.abs(ratio - 16 / 10) < 0.08) return "16:10 (Monitor Laptop)";
    if (Math.abs(ratio - 4 / 3) < 0.08) return "4:3 (Standar Monitor)";
    if (Math.abs(ratio - 1) < 0.05) return "1:1 (Persegi)";
    if (Math.abs(ratio - 210 / 297) < 0.05) return "A4 Tegak (Portrait)";
    if (Math.abs(ratio - 297 / 210) < 0.05) return "A4 Mendatar (Landscape)";
    return ratio > 1 ? `${ratio.toFixed(2)}:1 (Mendatar)` : `1:${(1 / ratio).toFixed(2)} (Tegak)`;
}

export default function ClientPdfToJpg() {
    // PDF Source File
    const [file, setFile] = useState<File | null>(null);
    const [isLoadingPdf, setIsLoadingPdf] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Extracted Pages Metadata (for thumbnail gallery & selection)
    const [pages, setPages] = useState<PageMeta[]>([]);
    
    // Output Settings
    const [outputFormat, setOutputFormat] = useState<OutputFormat>("jpg");
    const [renderQuality, setRenderQuality] = useState<RenderQuality>("high");
    const [selectionMode, setSelectionMode] = useState<PageSelectionMode>("all");
    const [customRange, setCustomRange] = useState("");

    // Active dropdown state for custom selects
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const dropdownContainerRef = useRef<HTMLDivElement>(null);

    // Extraction state
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractionProgress, setExtractionProgress] = useState("");
    const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([]);
    const [zipBlob, setZipBlob] = useState<Blob | null>(null);

    // Interactive Lightbox State (Shared for pre-extraction & post-extraction preview)
    const [previewItem, setPreviewItem] = useState<{
        title: string;
        url: string;
        pageNumber: number;
        total: number;
        width: number;
        height: number;
        aspectRatio: number;
        size?: number;
    } | null>(null);
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);
    const [previewSource, setPreviewSource] = useState<"pages" | "extracted">("pages");

    // Zoom & Pan state
    const [imageZoom, setImageZoom] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);
    const lightboxBodyRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
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

    // Cleanup object URLs on unmount or reset
    useEffect(() => {
        return () => {
            pages.forEach((p) => {
                if (p.thumbnailUrl) URL.revokeObjectURL(p.thumbnailUrl);
            });
            extractedImages.forEach((img) => {
                if (img.url) URL.revokeObjectURL(img.url);
            });
        };
    }, []);

    // Zoom Controls
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

    const closeLightbox = () => {
        setPreviewItem(null);
        setPreviewIndex(null);
        handleResetZoom();
    };

    // Zooming via mouse wheel over image container
    useEffect(() => {
        const el = lightboxBodyRef.current;
        if (!el || previewIndex === null) return;

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
    }, [previewIndex]);

    // Keyboard navigation (Escape, Left/Right, Zoom +/-/0)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                closeLightbox();
            } else if (previewIndex !== null) {
                const listLength = previewSource === "pages" ? pages.length : extractedImages.length;
                if (e.key === "ArrowLeft" && previewIndex > 0) {
                    navigatePreview(previewIndex - 1);
                } else if (e.key === "ArrowRight" && previewIndex < listLength - 1) {
                    navigatePreview(previewIndex + 1);
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
    }, [previewIndex, pages, extractedImages, previewSource, imageZoom]);

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

    // Open lightbox for pre-extraction pages
    const openPagePreview = (idx: number) => {
        const p = pages[idx];
        if (!p) return;
        setPreviewSource("pages");
        setPreviewIndex(idx);
        setPreviewItem({
            title: `${file?.name || "Dokumen"} - Halaman ${p.pageNumber}`,
            url: p.thumbnailUrl,
            pageNumber: p.pageNumber,
            total: pages.length,
            width: p.width,
            height: p.height,
            aspectRatio: p.aspectRatio,
        });
        handleResetZoom();
    };

    // Open lightbox for extracted images
    const openExtractedPreview = (idx: number) => {
        const img = extractedImages[idx];
        if (!img) return;
        setPreviewSource("extracted");
        setPreviewIndex(idx);
        setPreviewItem({
            title: img.fileName,
            url: img.url,
            pageNumber: img.pageNumber,
            total: extractedImages.length,
            width: img.width,
            height: img.height,
            aspectRatio: img.aspectRatio,
            size: img.size,
        });
        handleResetZoom();
    };

    const navigatePreview = (idx: number) => {
        if (previewSource === "pages") {
            openPagePreview(idx);
        } else {
            openExtractedPreview(idx);
        }
    };

    // Handle Upload PDF File
    const handleFiles = async (newFiles: File[]) => {
        const pdfFile = newFiles.find((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
        if (!pdfFile) return;

        // Reset previous states
        setFile(pdfFile);
        setIsLoadingPdf(true);
        setLoadingProgress("Membaca berkas dokumen PDF...");
        setErrorMessage(null);
        setPages([]);
        setExtractedImages([]);
        setZipBlob(null);

        try {
            if (typeof window !== "undefined") {
                pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
            }
            const arrayBuffer = await pdfFile.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({
                data: new Uint8Array(arrayBuffer),
                cMapUrl: "/cmaps/",
                cMapPacked: true,
                standardFontDataUrl: "/standard_fonts/",
            });
            const pdf = await loadingTask.promise;
            const totalPages = pdf.numPages;

            const loadedPages: PageMeta[] = [];

            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                setLoadingProgress(`Memuat pratinjau halaman ${pageNum} dari ${totalPages}...`);
                const page = await pdf.getPage(pageNum);

                // Scale 0.8 is crisp for preview and memory efficient
                const viewport = page.getViewport({ scale: 0.8 });
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");

                let thumbnailUrl = "";
                let w = Math.round(viewport.width);
                let h = Math.round(viewport.height);

                if (context) {
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    await page.render({ canvasContext: context, viewport, canvas }).promise;

                    const blob = await new Promise<Blob | null>((resolve) => {
                        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85);
                    });
                    if (blob) {
                        thumbnailUrl = URL.createObjectURL(blob);
                    }
                }

                loadedPages.push({
                    pageNumber: pageNum,
                    thumbnailUrl,
                    width: w,
                    height: h,
                    aspectRatio: w / (h || 1),
                    isSelected: true, // Default all selected
                });
            }

            setPages(loadedPages);
        } catch (err: unknown) {
            console.error("Gagal memuat dokumen PDF:", err);
            const msg = err instanceof Error ? err.message : String(err);
            setErrorMessage(`Terjadi kesalahan saat memuat dokumen PDF: ${msg}`);
            resetState();
        } finally {
            setIsLoadingPdf(false);
            setLoadingProgress("");
        }
    };

    // Toggle individual page selection
    const togglePageSelection = (pageNumber: number) => {
        setPages((prev) =>
            prev.map((p) => (p.pageNumber === pageNumber ? { ...p, isSelected: !p.isSelected } : p))
        );
        if (selectionMode !== "selected") {
            setSelectionMode("selected");
        }
    };

    // Select All / Deselect All
    const selectAllPages = () => {
        setPages((prev) => prev.map((p) => ({ ...p, isSelected: true })));
    };

    const deselectAllPages = () => {
        setPages((prev) => prev.map((p) => ({ ...p, isSelected: false })));
    };

    // Calculate which pages to extract based on selectionMode
    const pagesToExtract = useMemo(() => {
        if (!pages.length) return [];
        if (selectionMode === "all") {
            return pages;
        }
        if (selectionMode === "selected") {
            return pages.filter((p) => p.isSelected);
        }
        if (selectionMode === "range") {
            if (!customRange.trim()) return pages;
            const targetPageNums = new Set<number>();
            const parts = customRange.split(",").map((s) => s.trim());
            for (const part of parts) {
                if (part.includes("-")) {
                    const [startStr, endStr] = part.split("-");
                    const start = parseInt(startStr, 10);
                    const end = parseInt(endStr, 10);
                    if (!isNaN(start) && !isNaN(end)) {
                        for (let i = Math.max(1, Math.min(start, end)); i <= Math.min(pages.length, Math.max(start, end)); i++) {
                            targetPageNums.add(i);
                        }
                    }
                } else {
                    const num = parseInt(part, 10);
                    if (!isNaN(num) && num >= 1 && num <= pages.length) {
                        targetPageNums.add(num);
                    }
                }
            }
            return pages.filter((p) => targetPageNums.has(p.pageNumber));
        }
        return pages;
    }, [pages, selectionMode, customRange]);

    // Process Extraction: Render Selected PDF Pages to Canvas at Selected Quality
    const extractImages = async () => {
        if (!file || pagesToExtract.length === 0) return;
        setIsExtracting(true);
        setExtractionProgress("Mempersiapkan ekstraksi gambar...");
        setExtractedImages([]);
        setZipBlob(null);

        try {
            if (typeof window !== "undefined") {
                pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
            }
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({
                data: new Uint8Array(arrayBuffer),
                cMapUrl: "/cmaps/",
                cMapPacked: true,
                standardFontDataUrl: "/standard_fonts/",
            });
            const pdf = await loadingTask.promise;

            const scaleMap = {
                standard: 1.5,
                high: 2.0,
                ultra: 3.0,
            };
            const targetScale = scaleMap[renderQuality] || 2.0;

            const mimeMap = {
                jpg: "image/jpeg",
                png: "image/png",
                webp: "image/webp",
            };
            const mimeType = mimeMap[outputFormat] || "image/jpeg";
            const quality = outputFormat === "png" ? undefined : 0.95;
            const ext = outputFormat;

            const zip = new JSZip();
            const results: ExtractedImage[] = [];
            const baseName = file.name.replace(/\.[^/.]+$/, "");

            for (let i = 0; i < pagesToExtract.length; i++) {
                const targetPage = pagesToExtract[i];
                setExtractionProgress(
                    `Mengekstrak halaman ${targetPage.pageNumber} (${i + 1} dari ${pagesToExtract.length})...`
                );

                const page = await pdf.getPage(targetPage.pageNumber);
                const viewport = page.getViewport({ scale: targetScale });

                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                if (!context) continue;

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvasContext: context, viewport, canvas }).promise;

                const blob = await new Promise<Blob | null>((resolve) => {
                    canvas.toBlob((b) => resolve(b), mimeType, quality);
                });

                if (blob) {
                    const padPage = String(targetPage.pageNumber).padStart(2, "0");
                    const imgFileName = `${baseName}_halaman-${padPage}.${ext}`;
                    const imgUrl = URL.createObjectURL(blob);

                    zip.file(imgFileName, blob);
                    results.push({
                        pageNumber: targetPage.pageNumber,
                        fileName: imgFileName,
                        blob,
                        url: imgUrl,
                        width: Math.round(viewport.width),
                        height: Math.round(viewport.height),
                        aspectRatio: viewport.width / (viewport.height || 1),
                        size: blob.size,
                    });
                }
            }

            setExtractionProgress("Mengemas berkas gambar ke format ZIP...");
            const zipContent = await zip.generateAsync({
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: { level: 6 },
            });

            setZipBlob(zipContent);
            setExtractedImages(results);
        } catch (err: unknown) {
            console.error("Gagal mengekstrak gambar:", err);
            const msg = err instanceof Error ? err.message : String(err);
            setErrorMessage(`Terjadi kesalahan saat mengekstrak halaman PDF: ${msg}`);
        } finally {
            setIsExtracting(false);
            setExtractionProgress("");
        }
    };

    // Download Single Image
    const handleDownloadSingle = (img: ExtractedImage) => {
        const a = document.createElement("a");
        a.href = img.url;
        a.download = img.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Download All in ZIP
    const handleDownloadZip = () => {
        if (!zipBlob || !file) return;
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        a.download = `${baseName}_gambar-ekstrak.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Reset everything
    const resetState = () => {
        pages.forEach((p) => {
            if (p.thumbnailUrl) URL.revokeObjectURL(p.thumbnailUrl);
        });
        extractedImages.forEach((img) => {
            if (img.url) URL.revokeObjectURL(img.url);
        });
        setFile(null);
        setPages([]);
        setExtractedImages([]);
        setZipBlob(null);
        setIsExtracting(false);
        setCustomRange("");
        setSelectionMode("all");
        closeLightbox();
    };

    return (
        <div className="space-y-8 sm:space-y-12 animate-fade-in">
            {/* Banner Error jika terjadi kendala */}
            {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-lg animate-fade-in">
                    <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                            <strong className="block font-semibold text-rose-200">Pemberitahuan Berkas</strong>
                            <span className="text-foreground/80">{errorMessage}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setErrorMessage(null)}
                        className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer"
                        title="Tutup pemberitahuan"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Step 1: Upload Dropzone if no file selected */}
            {!file ? (
                <Dropzone
                    onFilesAccepted={handleFiles}
                    accept="application/pdf"
                    title="Pilih Berkas PDF"
                    description="Tarik & lepas dokumen PDF Anda di sini atau klik untuk memilih dari komputer / ponsel."
                    icons={
                        <div className="flex items-center gap-1.5">
                            <span className="text-amber-500 font-bold">Dokumen PDF</span>
                        </div>
                    }
                />
            ) : (
                <div className="space-y-8 animate-fade-in">
                    {/* Panel Pengaturan Ekstraksi */}
                    <div className="glass-panel p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-border/80 space-y-5 sm:space-y-6 shadow-xl">
                        {/* Header Panel */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-foreground text-sm sm:text-base md:text-lg truncate max-w-xs sm:max-w-md">
                                        {file.name}
                                    </h3>
                                    <p className="text-xs text-foreground/60">
                                        Total {pages.length} Halaman • {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={resetState}
                                disabled={isExtracting || isLoadingPdf}
                                className="text-xs text-foreground/50 hover:text-rose-400 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 self-end sm:self-auto"
                                title="Reset dan ganti berkas PDF"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Ganti / Reset Berkas</span>
                            </button>
                        </div>

                        {/* Loading PDF Pages Skeleton Notice */}
                        {isLoadingPdf && (
                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm flex items-center gap-3 animate-pulse">
                                <RefreshCw className="w-5 h-5 animate-spin text-amber-400 shrink-0" />
                                <span>{loadingProgress || "Memproses halaman PDF..."}</span>
                            </div>
                        )}

                        {/* Opsi Konfigurasi Dropdown & Mode */}
                        <div ref={dropdownContainerRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
                            {/* 1. Format Output */}
                            <CustomSelect
                                id="format-select"
                                label="Format Gambar"
                                icon={<ImageIcon className="w-3.5 h-3.5 text-amber-500" />}
                                value={outputFormat}
                                onChange={setOutputFormat}
                                activeDropdown={activeDropdown}
                                setActiveDropdown={setActiveDropdown}
                                options={[
                                    {
                                        value: "jpg",
                                        label: "JPG / JPEG (.jpg)",
                                        description: "Kompatibel universal & ukuran berkas hemat",
                                    },
                                    {
                                        value: "png",
                                        label: "PNG (.png)",
                                        description: "Lossless tanpa kompresi, teks kristal tajam",
                                    },
                                    {
                                        value: "webp",
                                        label: "WebP (.webp)",
                                        description: "Format web modern, kualitas tinggi & sangat ringan",
                                    },
                                ]}
                            />

                            {/* 2. Kualitas / Resolusi Render */}
                            <CustomSelect
                                id="quality-select"
                                label="Resolusi & Ketajaman"
                                icon={<Sliders className="w-3.5 h-3.5 text-amber-500" />}
                                value={renderQuality}
                                onChange={setRenderQuality}
                                activeDropdown={activeDropdown}
                                setActiveDropdown={setActiveDropdown}
                                options={[
                                    {
                                        value: "standard",
                                        label: "Standar (1.5× DPI)",
                                        description: "Proses cepat & ukuran file sangat ringan",
                                    },
                                    {
                                        value: "high",
                                        label: "Tinggi / HD (2.0× DPI - Rekomendasi)",
                                        description: "Seimbang sempurna untuk dokumen, tugas & bacaan",
                                    },
                                    {
                                        value: "ultra",
                                        label: "Ultra HD (3.0× DPI / 300 DPI)",
                                        description: "Maksimal tajam untuk kodingan, teks kecil & cetak",
                                    },
                                ]}
                            />

                            {/* 3. Pilihan Halaman */}
                            <CustomSelect
                                id="selection-select"
                                label="Halaman yang Diekstrak"
                                icon={<Filter className="w-3.5 h-3.5 text-amber-500" />}
                                value={selectionMode}
                                onChange={setSelectionMode}
                                activeDropdown={activeDropdown}
                                setActiveDropdown={setActiveDropdown}
                                options={[
                                    {
                                        value: "all",
                                        label: `Semua Halaman (${pages.length} Hal)`,
                                        description: "Ekstrak seluruh halaman dokumen",
                                    },
                                    {
                                        value: "selected",
                                        label: `Halaman Pilihan (${pages.filter((p) => p.isSelected).length} Dipilih)`,
                                        description: "Pilih halaman spesifik melalui centang di bawah",
                                    },
                                    {
                                        value: "range",
                                        label: "Rentang Kustom (Custom Range)",
                                        description: "Tuliskan nomor halaman (misal: 1, 3-5)",
                                    },
                                ]}
                            />
                        </div>

                        {/* Input Rentang Halaman Kustom */}
                        {selectionMode === "range" && (
                            <div className="p-3.5 sm:p-4 rounded-2xl bg-surface/60 border border-amber-500/40 space-y-2 animate-fade-in">
                                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                    <span>Masukkan Nomor Halaman:</span>
                                    <span className="text-[11px] text-amber-400 font-normal">
                                        Contoh: 1, 3-5, 8
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={customRange}
                                    onChange={(e) => setCustomRange(e.target.value)}
                                    placeholder={`1-${pages.length}`}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border/80 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all font-mono"
                                />
                                <p className="text-[11px] text-foreground/60">
                                    Akan mengekstrak <strong>{pagesToExtract.length} halaman</strong> dari total {pages.length} halaman.
                                </p>
                            </div>
                        )}

                        {/* Banner Tips */}
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div className="leading-relaxed">
                                Seluruh ekstraksi diproses <strong>100% lokal langsung di peramban Anda (Offline & Privat)</strong>. Dokumen rahasia Anda tidak pernah diunggah ke peladen/internet manapun.
                            </div>
                        </div>
                    </div>

                    {/* Header List Halaman & Tombol Proses */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                    Halaman Dokumen ({pagesToExtract.length} dari {pages.length} Terpilih)
                                </h2>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-foreground/60">
                                <button
                                    type="button"
                                    onClick={selectAllPages}
                                    className="text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                                >
                                    Pilih Semua
                                </button>
                                <span>•</span>
                                <button
                                    type="button"
                                    onClick={deselectAllPages}
                                    className="text-foreground/50 hover:text-foreground underline cursor-pointer"
                                >
                                    Hapus Semua Pilihan
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={extractImages}
                            disabled={isExtracting || isLoadingPdf || pagesToExtract.length === 0}
                            className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                                isExtracting || pagesToExtract.length === 0
                                    ? "bg-amber-500/50 cursor-not-allowed"
                                    : "bg-amber-500 hover:bg-amber-600 hover:scale-105 active:scale-95 shadow-amber-500/20"
                            }`}
                        >
                            {isExtracting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Mengekstrak Gambar...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    <span>Ekstrak {pagesToExtract.length} Halaman ke {outputFormat.toUpperCase()}</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Progress Bar Ekstraksi */}
                    {isExtracting && extractionProgress && (
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium flex items-center gap-3 animate-pulse shadow-lg">
                            <RefreshCw className="w-5 h-5 animate-spin shrink-0 text-amber-400" />
                            <span>{extractionProgress}</span>
                        </div>
                    )}

                    {/* Grid Halaman Dokumen (Sebelum Ekstraksi) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {pages.map((p, idx) => {
                            const isIncluded = pagesToExtract.some((tp) => tp.pageNumber === p.pageNumber);
                            return (
                                <div
                                    key={p.pageNumber}
                                    className={`relative aspect-3/4 rounded-2xl overflow-hidden glass-panel border group flex flex-col transition-all shadow-sm ${
                                        isIncluded
                                            ? "border-amber-500/60 ring-1 ring-amber-500/30 bg-surface/60"
                                            : "border-border/60 opacity-50 bg-surface/30"
                                    }`}
                                >
                                    {/* Label Nomor Halaman */}
                                    <div className="absolute top-2.5 left-2.5 z-10 px-2 py-1 rounded-md bg-black/75 backdrop-blur-md text-white text-[11px] font-bold border border-white/10">
                                        Hal {p.pageNumber}
                                    </div>

                                    {/* Checkbox Pemilihan */}
                                    <button
                                        type="button"
                                        onClick={() => togglePageSelection(p.pageNumber)}
                                        className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-lg bg-black/75 hover:bg-black text-white border border-white/20 transition-all hover:scale-110 cursor-pointer"
                                        title={isIncluded ? "Batalkan pilihan halaman ini" : "Pilih halaman ini untuk diekstrak"}
                                    >
                                        {isIncluded ? (
                                            <CheckSquare className="w-4 h-4 text-amber-400" />
                                        ) : (
                                            <Square className="w-4 h-4 text-foreground/40" />
                                        )}
                                    </button>

                                    {/* Dimensi & Format Tag */}
                                    <div className="absolute bottom-11 left-2 z-10 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white/90 text-[10px] font-medium border border-white/10">
                                        {p.width}×{p.height} • {formatRatio(p.aspectRatio)}
                                    </div>

                                    {/* Preview Thumbnail (Klik untuk melihat Pratinjau Penuh) */}
                                    <div
                                        onClick={() => openPagePreview(idx)}
                                        className="flex-1 relative overflow-hidden flex items-center justify-center bg-black/40 cursor-zoom-in group/img"
                                        title="Klik untuk membuka pratinjau halaman ini"
                                    >
                                        {p.thumbnailUrl ? (
                                            <img
                                                src={p.thumbnailUrl}
                                                alt={`Halaman ${p.pageNumber}`}
                                                className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover/img:scale-105"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-foreground/40 gap-1 text-xs">
                                                <FileText className="w-6 h-6" />
                                                <span>Hal {p.pageNumber}</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-xs">
                                            <Eye className="w-4 h-4 text-amber-400" />
                                            <span>Pratinjau Layar Penuh</span>
                                        </div>
                                    </div>

                                    {/* Footer Kartu Halaman */}
                                    <div className="p-2.5 bg-surface/90 border-t border-border/50 flex items-center justify-between text-xs">
                                        <span className="text-foreground/80 font-medium truncate">
                                            Halaman {p.pageNumber}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => openPagePreview(idx)}
                                            className="text-amber-400 hover:text-amber-300 transition-colors p-1"
                                            title="Pratinjau foto ini"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Step 3: Hasil Ekstraksi (Success State & Gallery) */}
                    {zipBlob && extractedImages.length > 0 && (
                        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/40 bg-emerald-500/5 space-y-8 shadow-2xl animate-fade-in mt-8">
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-linear-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30 animate-bounce">
                                    <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                                        Ekstraksi Berhasil Selesai!
                                    </h3>
                                    <p className="text-foreground/70 text-sm sm:text-base max-w-lg mx-auto">
                                        Berhasil mengekstrak <strong>{extractedImages.length} halaman</strong> ke format <strong>{outputFormat.toUpperCase()}</strong> berkemampuan resolusi HD.
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2 w-full">
                                    <button
                                        onClick={handleDownloadZip}
                                        className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
                                    >
                                        <Download className="w-5 h-5" />
                                        <span>Unduh Semua Gambar (ZIP • {(zipBlob.size / 1024 / 1024).toFixed(2)} MB)</span>
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

                            {/* Galeri Gambar yang Telah Diekstrak (Dapat Diunduh Satuan & Di-zoom) */}
                            <div className="space-y-4 pt-6 border-t border-border/40">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <h4 className="font-bold text-foreground text-base sm:text-lg">
                                            Unduh Gambar Satuan / Pratinjau
                                        </h4>
                                        <p className="text-xs text-foreground/60">
                                            Anda juga dapat mengunduh gambar halaman tertentu secara individual tanpa perlu mengekstrak file ZIP.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {extractedImages.map((img, idx) => (
                                        <div
                                            key={img.fileName}
                                            className="relative aspect-3/4 rounded-2xl overflow-hidden glass-panel border border-border/80 group flex flex-col bg-surface/50 shadow-sm"
                                        >
                                            {/* Tag Nomor Halaman */}
                                            <div className="absolute top-2.5 left-2.5 z-10 px-2 py-1 rounded-md bg-black/75 backdrop-blur-md text-white text-[11px] font-bold border border-white/10">
                                                Hal {img.pageNumber}
                                            </div>

                                            {/* Tombol Unduh Satuan */}
                                            <button
                                                type="button"
                                                onClick={() => handleDownloadSingle(img)}
                                                className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-all hover:scale-110 shadow-sm cursor-pointer"
                                                title="Unduh gambar halaman ini saja"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                            </button>

                                            {/* Dimensi & Ukuran Berkas */}
                                            <div className="absolute bottom-11 left-2 z-10 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white/90 text-[10px] font-medium border border-white/10">
                                                {img.width}×{img.height} • {(img.size / 1024).toFixed(0)} KB
                                            </div>

                                            {/* Pratinjau Gambar Ekstrak */}
                                            <div
                                                onClick={() => openExtractedPreview(idx)}
                                                className="flex-1 relative overflow-hidden flex items-center justify-center bg-black/40 cursor-zoom-in group/img"
                                                title="Klik untuk melihat pratinjau penuh & zoom"
                                            >
                                                <img
                                                    src={img.url}
                                                    alt={img.fileName}
                                                    className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover/img:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-xs">
                                                    <Eye className="w-4 h-4 text-amber-400" />
                                                    <span>Pratinjau Layar Penuh</span>
                                                </div>
                                            </div>

                                            {/* Bar Nama File & Aksi */}
                                            <div className="p-2.5 bg-surface/90 border-t border-border/50 flex items-center justify-between text-xs gap-1">
                                                <span className="text-foreground/80 font-medium truncate flex-1" title={img.fileName}>
                                                    {img.fileName}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownloadSingle(img)}
                                                    className="text-emerald-400 hover:text-emerald-300 transition-colors p-1"
                                                    title="Unduh gambar"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Pratinjau Foto Penuh dengan Zoom, Pan, dan Sudut Tajam (rounded-none) */}
            {previewItem && (
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
                                    Hal {previewItem.pageNumber} dari {previewItem.total}
                                </span>
                                <span className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-28 sm:max-w-xs md:max-w-md">
                                    {previewItem.title}
                                </span>
                                <span className="text-xs text-foreground/50 hidden md:inline shrink-0">
                                    ({previewItem.width} × {previewItem.height} px
                                    {previewItem.size ? ` • ${(previewItem.size / 1024).toFixed(0)} KB` : ""})
                                </span>
                            </div>

                            {/* Toolbar Kontrol Zoom, Unduh & Tutup */}
                            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                                {/* Toolbar Zoom */}
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

                                {/* Tombol Unduh Cepat jika melihat hasil ekstrak */}
                                {previewSource === "extracted" && previewIndex !== null && extractedImages[previewIndex] && (
                                    <button
                                        type="button"
                                        onClick={() => handleDownloadSingle(extractedImages[previewIndex])}
                                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                                        title="Unduh gambar ini"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Unduh</span>
                                    </button>
                                )}

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

                        {/* Body Lightbox (Foto Besar, Zoom, Pan & Sudut Persegi 90 Derajat) */}
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
                                title={
                                    imageZoom > 1
                                        ? "Tahan & geser untuk melihat area lain, klik ganda untuk reset"
                                        : "Klik ganda untuk memperbesar (2x)"
                                }
                            >
                                <img
                                    src={previewItem.url}
                                    alt={previewItem.title}
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
                            {previewIndex !== null && previewIndex > 0 && (
                                <button
                                    type="button"
                                    onClick={() => navigatePreview(previewIndex - 1)}
                                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-black/75 hover:bg-amber-500 text-white border border-white/20 transition-all hover:scale-110 shadow-xl cursor-pointer"
                                    title="Halaman Sebelumnya (Panah Kiri)"
                                >
                                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            )}

                            {/* Navigasi Panah Kanan */}
                            {previewIndex !== null &&
                                previewIndex < (previewSource === "pages" ? pages.length : extractedImages.length) - 1 && (
                                    <button
                                        type="button"
                                        onClick={() => navigatePreview(previewIndex + 1)}
                                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-black/75 hover:bg-amber-500 text-white border border-white/20 transition-all hover:scale-110 shadow-xl cursor-pointer"
                                        title="Halaman Berikutnya (Panah Kanan)"
                                    >
                                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                )}
                        </div>

                        {/* Footer Lightbox */}
                        <div className="p-2.5 sm:p-3 sm:px-6 border-t border-border/50 bg-surface/50 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs text-foreground/60">
                            <span className="hidden sm:inline">
                                Tips: Scroll mouse / klik ganda untuk zoom • Geser untuk navigasi • ⬅ ➡ untuk ganti halaman • Esc untuk keluar
                            </span>
                            <span className="sm:hidden text-[11px]">Ketuk 2x untuk zoom • Geser untuk memindahkan</span>
                            <span className="text-[11px] sm:text-xs">Format: {formatRatio(previewItem.aspectRatio)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
