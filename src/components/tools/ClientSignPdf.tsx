"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Dropzone from "@/components/ui/Dropzone";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";
import {
    PenTool,
    Download,
    FileText,
    Sparkles,
    CheckCircle2,
    Loader2,
    HardDrive,
    FolderOpen,
    Check,
    RotateCcw,
    Upload,
    Type,
    Eraser,
    ChevronLeft,
    ChevronRight,
    Move,
    Maximize2,
    Eye
} from "lucide-react";

// Setup PDF.js worker using jsdelivr
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

type SignatureMethod = "draw" | "upload" | "type";
type PenColor = "#09090b" | "#1e3a8a" | "#2563eb";

export default function ClientSignPdf() {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [pageCount, setPageCount] = useState<number>(0);
    const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
    const [pageCanvasDataUrl, setPageCanvasDataUrl] = useState<string>("");
    const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({ width: 500, height: 700 });

    // Signature creation state
    const [method, setMethod] = useState<SignatureMethod>("draw");
    const [penColor, setPenColor] = useState<PenColor>("#09090b");
    const [penWidth, setPenWidth] = useState<number>(3);
    const [typedName, setTypedName] = useState<string>("");
    const [typedFont, setTypedFont] = useState<string>("cursive");
    const [activeSignatureDataUrl, setActiveSignatureDataUrl] = useState<string | null>(null);

    // Signature placement state on document
    const [sigPosition, setSigPosition] = useState<{ x: number; y: number }>({ x: 150, y: 400 });
    const [sigSize, setSigSize] = useState<{ width: number; height: number }>({ width: 160, height: 70 });
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isSaved, setIsSaved] = useState<boolean>(false);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const sigCanvasRef = useRef<HTMLCanvasElement>(null);
    const docContainerRef = useRef<HTMLDivElement>(null);
    const isDrawingRef = useRef<boolean>(false);

    // Load PDF Page
    const renderPdfPage = useCallback(async (pdfFile: File, pageIdx: number) => {
        setIsLoading(true);
        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
            const pdf = await loadingTask.promise;
            setPageCount(pdf.numPages);

            const pageNumber = Math.min(Math.max(1, pageIdx + 1), pdf.numPages);
            const page = await pdf.getPage(pageNumber);
            
            // Render with scale 1.0 for sharp document preview
            const viewport = page.getViewport({ scale: 1.0 });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");

            if (context) {
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                await page.render({ canvasContext: context, viewport, canvas }).promise;
                const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
                setPageCanvasDataUrl(dataUrl);
                setCanvasSize({ width: viewport.width, height: viewport.height });

                // Position signature around bottom right by default
                setSigPosition({
                    x: Math.max(20, viewport.width * 0.6),
                    y: Math.max(20, viewport.height * 0.75)
                });
            }
        } catch (err) {
            console.error("Failed to render PDF page:", err);
            alert("Gagal membaca berkas PDF. Pastikan file valid atau tidak terenkripsi rusak.");
            setFile(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleFileAccepted = (acceptedFiles: File[]) => {
        const pdfFile = acceptedFiles.find(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
        if (!pdfFile) {
            alert("Silakan pilih berkas dokumen berformat PDF.");
            return;
        }

        setFile(pdfFile);
        setCurrentPageIndex(0);
        setIsSaved(false);
        renderPdfPage(pdfFile, 0);
    };

    const handlePageChange = (newIndex: number) => {
        if (!file || newIndex < 0 || newIndex >= pageCount) return;
        setCurrentPageIndex(newIndex);
        renderPdfPage(file, newIndex);
    };

    const handleClear = () => {
        setFile(null);
        setPageCanvasDataUrl("");
        setPageCount(0);
        setCurrentPageIndex(0);
        setActiveSignatureDataUrl(null);
        setIsSaved(false);
        setIsLoading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Canvas Drawing Pad Handlers
    const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = sigCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.strokeStyle = penColor;
        ctx.lineWidth = penWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        isDrawingRef.current = true;
    };

    const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return;
        const canvas = sigCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;
        saveDrawnSignature();
    };

    const clearDrawingCanvas = () => {
        const canvas = sigCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setActiveSignatureDataUrl(null);
    };

    const saveDrawnSignature = () => {
        const canvas = sigCanvasRef.current;
        if (!canvas) return;
        setActiveSignatureDataUrl(canvas.toDataURL("image/png"));
    };

    // Upload signature with auto-transparent background
    const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const uploadedImg = e.target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                ctx.drawImage(img, 0, 0);
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;

                // Auto-remove white / light background to make signature crisp transparent
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    // If near-white (brightness > 220), make fully transparent
                    if (r > 215 && g > 215 && b > 215) {
                        data[i + 3] = 0;
                    } else if (r > 190 && g > 190 && b > 190) {
                        // Smooth feathering
                        data[i + 3] = Math.round((255 - ((r + g + b) / 3)) * 2);
                    }
                }

                ctx.putImageData(imgData, 0, 0);
                setActiveSignatureDataUrl(canvas.toDataURL("image/png"));
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(uploadedImg);
    };

    // Typed signature generator
    const generateTypedSignature = (text: string, fontStyle: string) => {
        if (!text.trim()) {
            setActiveSignatureDataUrl(null);
            return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = 450;
        canvas.height = 150;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = penColor;
        ctx.font = `italic bold 52px ${fontStyle}, "Brush Script MT", cursive, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text.trim(), canvas.width / 2, canvas.height / 2);

        setActiveSignatureDataUrl(canvas.toDataURL("image/png"));
    };

    // Dragging handlers for signature on PDF preview
    const handlePointerDownSig = (e: React.PointerEvent<HTMLDivElement>) => {
        e.stopPropagation();
        setIsDragging(true);
        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    const handlePointerMoveDoc = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging || !docContainerRef.current) return;
        const docRect = docContainerRef.current.getBoundingClientRect();
        
        const rawX = e.clientX - docRect.left - dragOffset.x;
        const rawY = e.clientY - docRect.top - dragOffset.y;

        // Keep inside bounds
        const boundedX = Math.max(0, Math.min(rawX, canvasSize.width - sigSize.width));
        const boundedY = Math.max(0, Math.min(rawY, canvasSize.height - sigSize.height));

        setSigPosition({ x: boundedX, y: boundedY });
    };

    const handlePointerUpDoc = () => {
        setIsDragging(false);
    };

    // Final Embed & Save via pdf-lib
    const saveSignedPdf = async () => {
        if (!file || !activeSignatureDataUrl) {
            alert("Silakan buat atau pilih tanda tangan terlebih dahulu.");
            return;
        }

        setIsSaving(true);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const page = pdfDoc.getPage(currentPageIndex);
            const { width: pdfWidth, height: pdfHeight } = page.getSize();

            // Convert base64 signature data URL to binary array
            const sigResponse = await fetch(activeSignatureDataUrl);
            const sigArrayBuffer = await sigResponse.arrayBuffer();
            const embeddedSig = await pdfDoc.embedPng(sigArrayBuffer);

            // Calculate precise coordinates relative to the PDF's point system
            // In PDF, (0, 0) is bottom-left, while DOM is top-left
            const pdfX = (sigPosition.x / canvasSize.width) * pdfWidth;
            const pdfY = ((canvasSize.height - sigPosition.y - sigSize.height) / canvasSize.height) * pdfHeight;
            const pdfW = (sigSize.width / canvasSize.width) * pdfWidth;
            const pdfH = (sigSize.height / canvasSize.height) * pdfHeight;

            page.drawImage(embeddedSig, {
                x: pdfX,
                y: pdfY,
                width: pdfW,
                height: pdfH,
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const nameParts = file.name.split(".");
            const ext = nameParts.pop();
            const baseName = nameParts.join(".");
            a.download = `${baseName}-bertandatangan.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setIsSaved(true);
        } catch (err) {
            console.error("Failed to save signed PDF:", err);
            alert("Gagal menyematkan tanda tangan ke dokumen PDF. Silakan coba lagi.");
        } finally {
            setIsSaving(false);
        }
    };

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
                        title="Tarik & Letakkan File PDF untuk Ditandatangani"
                        description="Mendukung surat lamaran kerja, berkas pendaftaran, formulir, atau dokumen kontrak PDF apapun. Semua proses berjalan 100% lokal di browser Anda."
                        icons={
                            <div className="flex items-center gap-2 text-rose-500 font-semibold text-sm">
                                <FileText className="w-5 h-5" />
                                <span>Dokumen PDF (Semua Halaman)</span>
                            </div>
                        }
                    />
                </div>
            ) : isLoading ? (
                <div className="glass-panel p-12 rounded-3xl border border-border/80 text-center space-y-4 shadow-xl">
                    <Loader2 className="w-10 h-10 animate-spin text-rose-500 mx-auto" />
                    <h3 className="text-lg font-bold text-foreground">Menyiapkan Lembar Dokumen...</h3>
                    <p className="text-sm text-foreground/60">Memuat halaman PDF untuk penempatan tanda tangan...</p>
                </div>
            ) : (
                <div className="space-y-8 animate-fade-in">
                    {/* Top Action Bar */}
                    <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-border/80 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                                <PenTool className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-base sm:text-lg text-foreground truncate">
                                    {file.name}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-foreground/60 mt-0.5">
                                    <span>Halaman {currentPageIndex + 1} dari {pageCount}</span>
                                    <span>•</span>
                                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    <span>•</span>
                                    <span className="text-emerald-400 font-medium">100% Offline e-Sign</span>
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

                    {/* Main Signature Workspace: Creator Studio (Left) & Document Preview with Drag/Resize (Right) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left Column: Signature Creator Studio */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="glass-panel p-6 rounded-3xl border border-border/80 shadow-xl space-y-6">
                                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                    <div className="flex items-center gap-2">
                                        <PenTool className="w-5 h-5 text-rose-500" />
                                        <h4 className="font-bold text-base text-foreground">Buat Tanda Tangan</h4>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">
                                        Studio
                                    </span>
                                </div>

                                {/* Method Switcher Tabs */}
                                <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface/60 rounded-xl border border-border/60">
                                    <button
                                        type="button"
                                        onClick={() => setMethod("draw")}
                                        className={`py-2 text-xs font-bold rounded-lg transition-all ${method === "draw"
                                            ? "bg-rose-600 text-white shadow-md"
                                            : "text-foreground/70 hover:text-foreground"
                                            }`}
                                    >
                                        ✍️ Gambar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMethod("upload")}
                                        className={`py-2 text-xs font-bold rounded-lg transition-all ${method === "upload"
                                            ? "bg-rose-600 text-white shadow-md"
                                            : "text-foreground/70 hover:text-foreground"
                                            }`}
                                    >
                                        📷 Upload Foto
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMethod("type")}
                                        className={`py-2 text-xs font-bold rounded-lg transition-all ${method === "type"
                                            ? "bg-rose-600 text-white shadow-md"
                                            : "text-foreground/70 hover:text-foreground"
                                            }`}
                                    >
                                        ⌨️ Ketik Nama
                                    </button>
                                </div>

                                {/* 1. DRAW TAB */}
                                {method === "draw" && (
                                    <div className="space-y-4 animate-fade-in">
                                        {/* Color & Pen Controls */}
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-foreground/60">Warna Tinta:</span>
                                                <div className="flex items-center gap-1.5">
                                                    {[
                                                        { color: "#09090b" as PenColor, bg: "bg-black", label: "Hitam" },
                                                        { color: "#1e3a8a" as PenColor, bg: "bg-blue-900", label: "Biru Tua" },
                                                        { color: "#2563eb" as PenColor, bg: "bg-blue-600", label: "Biru" },
                                                    ].map((c) => (
                                                        <button
                                                            key={c.color}
                                                            type="button"
                                                            onClick={() => setPenColor(c.color)}
                                                            className={`w-6 h-6 rounded-full ${c.bg} border transition-transform ${penColor === c.color ? "scale-125 ring-2 ring-rose-500 ring-offset-2 ring-offset-surface" : "opacity-70 hover:opacity-100"}`}
                                                            title={c.label}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={clearDrawingCanvas}
                                                className="inline-flex items-center gap-1 text-foreground/60 hover:text-rose-400 font-semibold"
                                            >
                                                <Eraser className="w-3.5 h-3.5" />
                                                <span>Hapus</span>
                                            </button>
                                        </div>

                                        {/* Interactive Canvas Pad */}
                                        <div className="border-2 border-dashed border-border/80 rounded-2xl bg-surface/50 overflow-hidden relative shadow-inner">
                                            <canvas
                                                ref={sigCanvasRef}
                                                width={400}
                                                height={180}
                                                className="w-full h-44 touch-none cursor-crosshair bg-transparent"
                                                onPointerDown={startDrawing}
                                                onPointerMove={draw}
                                                onPointerUp={stopDrawing}
                                                onPointerLeave={stopDrawing}
                                            />
                                            {!activeSignatureDataUrl && (
                                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-foreground/30 text-xs">
                                                    Goreskan tanda tangan Anda di sini
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 2. UPLOAD TAB */}
                                {method === "upload" && (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="p-4 rounded-2xl bg-surface/40 border border-border/60 text-xs text-foreground/70 space-y-2">
                                            <p className="font-semibold text-foreground">💡 Fitur Cerdas Auto-Transparan:</p>
                                            <p>Foto tanda tangan di atas kertas putih akan otomatis dibersihkan latar belakangnya agar tembus pandang dan menyatu rapi dengan dokumen.</p>
                                        </div>

                                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/80 hover:border-rose-500/50 rounded-2xl bg-surface/40 hover:bg-surface/60 transition-colors cursor-pointer text-center space-y-2">
                                            <Upload className="w-8 h-8 text-rose-500" />
                                            <span className="text-xs font-bold text-foreground">Pilih Foto Tanda Tangan (PNG / JPG)</span>
                                            <span className="text-[10px] text-foreground/50">Maksimal 5 MB</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleUploadSignature}
                                            />
                                        </label>
                                    </div>
                                )}

                                {/* 3. TYPE TAB */}
                                {method === "type" && (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                                                Ketik Nama Anda
                                            </label>
                                            <input
                                                type="text"
                                                value={typedName}
                                                onChange={(e) => {
                                                    setTypedName(e.target.value);
                                                    generateTypedSignature(e.target.value, typedFont);
                                                }}
                                                placeholder="Contoh: Budi Santoso"
                                                className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border/80 text-foreground font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <span className="text-xs font-bold text-foreground/60">Pilihan Gaya Kaligrafi:</span>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { font: "cursive", label: "Gaya Elegan" },
                                                    { font: '"Brush Script MT", cursive', label: "Gaya Kuas" },
                                                ].map((f) => (
                                                    <button
                                                        key={f.font}
                                                        type="button"
                                                        onClick={() => {
                                                            setTypedFont(f.font);
                                                            generateTypedSignature(typedName, f.font);
                                                        }}
                                                        className={`p-2 rounded-xl border text-xs font-semibold ${typedFont === f.font ? "bg-rose-500/20 text-rose-400 border-rose-500/40" : "bg-surface/50 text-foreground/70 border-border/60"}`}
                                                    >
                                                        {f.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Signature Size Adjuster */}
                                {activeSignatureDataUrl && (
                                    <div className="space-y-3 pt-4 border-t border-border/40">
                                        <div className="flex justify-between items-center text-xs font-bold">
                                            <span className="text-foreground/70 flex items-center gap-1.5">
                                                <Maximize2 className="w-3.5 h-3.5 text-rose-500" />
                                                Ukuran Tanda Tangan:
                                            </span>
                                            <span className="text-rose-400 font-mono">{sigSize.width} px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="80"
                                            max="300"
                                            step="5"
                                            value={sigSize.width}
                                            onChange={(e) => {
                                                const w = parseInt(e.target.value);
                                                setSigSize({ width: w, height: Math.round(w * 0.45) });
                                            }}
                                            className="w-full accent-rose-500 cursor-pointer"
                                        />
                                    </div>
                                )}

                                {/* Final Embed & Download Button */}
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={saveSignedPdf}
                                        disabled={isSaving || !activeSignatureDataUrl}
                                        className={`w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl text-base font-bold text-white shadow-xl transition-all ${isSaving || !activeSignatureDataUrl
                                            ? "bg-rose-500/50 cursor-not-allowed"
                                            : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 hover:scale-[1.01] active:scale-95 cursor-pointer"
                                            }`}
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Menyematkan ke Dokumen...</span>
                                            </>
                                        ) : isSaved ? (
                                            <>
                                                <Check className="w-5 h-5" />
                                                <span>Unduh Ulang PDF Bertanda Tangan</span>
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-5 h-5" />
                                                <span>Terapkan & Unduh PDF</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: PDF Preview Workspace with Drag-and-Drop Signature */}
                        <div className="lg:col-span-7 space-y-4">
                            <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-border/80 shadow-xl space-y-4">
                                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Eye className="w-4 h-4 text-rose-500" />
                                        <h4 className="font-bold text-sm text-foreground">
                                            Lembar Dokumen (Geser Tanda Tangan ke Kolom yang Dituju)
                                        </h4>
                                    </div>

                                    {/* Page Navigator */}
                                    {pageCount > 1 && (
                                        <div className="flex items-center gap-1.5 bg-surface/60 px-2 py-1 rounded-xl border border-border/60">
                                            <button
                                                type="button"
                                                onClick={() => handlePageChange(currentPageIndex - 1)}
                                                disabled={currentPageIndex === 0}
                                                className="p-1 rounded-md text-foreground/70 hover:text-foreground disabled:opacity-30"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <span className="text-xs font-semibold px-1">
                                                {currentPageIndex + 1} / {pageCount}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handlePageChange(currentPageIndex + 1)}
                                                disabled={currentPageIndex >= pageCount - 1}
                                                className="p-1 rounded-md text-foreground/70 hover:text-foreground disabled:opacity-30"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Document Viewport Area */}
                                <div className="overflow-x-auto max-h-187.5 overflow-y-auto rounded-2xl bg-black/40 border border-border/60 p-4 flex justify-center">
                                    <div
                                        ref={docContainerRef}
                                        className="relative bg-white shadow-2xl select-none"
                                        style={{
                                            width: `${canvasSize.width}px`,
                                            height: `${canvasSize.height}px`,
                                        }}
                                        onPointerMove={handlePointerMoveDoc}
                                        onPointerUp={handlePointerUpDoc}
                                        onPointerLeave={handlePointerUpDoc}
                                    >
                                        {/* Rendered PDF Page Background */}
                                        {pageCanvasDataUrl && (
                                            <img
                                                src={pageCanvasDataUrl}
                                                alt={`Halaman ${currentPageIndex + 1}`}
                                                className="w-full h-full object-contain pointer-events-none"
                                            />
                                        )}

                                        {/* Draggable Signature Overlay Box */}
                                        {activeSignatureDataUrl ? (
                                            <div
                                                className={`absolute cursor-move border-2 border-dashed transition-shadow group ${isDragging
                                                    ? "border-rose-500 shadow-2xl ring-2 ring-rose-500/30 scale-105"
                                                    : "border-blue-500/80 hover:border-rose-500 hover:shadow-lg"
                                                    }`}
                                                style={{
                                                    left: `${sigPosition.x}px`,
                                                    top: `${sigPosition.y}px`,
                                                    width: `${sigSize.width}px`,
                                                    height: `${sigSize.height}px`,
                                                    touchAction: "none",
                                                }}
                                                onPointerDown={handlePointerDownSig}
                                            >
                                                <img
                                                    src={activeSignatureDataUrl}
                                                    alt="Tanda Tangan"
                                                    className="w-full h-full object-contain pointer-events-none"
                                                />
                                                {/* Drag handle tooltip */}
                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[9px] px-2 py-0.5 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap flex items-center gap-1">
                                                    <Move className="w-2.5 h-2.5" />
                                                    Geser Posisi
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                                <div className="bg-black/70 backdrop-blur-md text-white text-xs px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-white/20">
                                                    <PenTool className="w-4 h-4 text-rose-400" />
                                                    <span>Buat tanda tangan di panel kiri untuk menampilkannya di sini</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <p className="text-center text-xs text-foreground/50">
                                    💡 <em>Sentuh dan geser kotak tanda tangan di atas lembar dokumen untuk menempatkannya tepat di atas kolom nama/paraf.</em>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
