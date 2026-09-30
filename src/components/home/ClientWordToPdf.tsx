"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Dropzone from "@/components/ui/Dropzone";
import { renderAsync } from "docx-preview";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { 
    FileText, 
    RotateCcw, 
    Download, 
    Eye, 
    CheckCircle2, 
    Loader2, 
    AlertCircle,
    Layers
} from "lucide-react";
import PdfEmbeddedViewer from "@/components/shared/PdfEmbeddedViewer";

export default function ClientWordToPdf() {
    const [docxFiles, setDocxFiles] = useState<File[]>([]);
    const [isRenderingPreview, setIsRenderingPreview] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [convertProgress, setConvertProgress] = useState<number>(0);
    const [progressStatus, setProgressStatus] = useState<string>("");
    const [pageCount, setPageCount] = useState<number>(0);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const previewContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const renderDocxPreview = useCallback(async (file: File) => {
        if (!previewContainerRef.current) return;
        setIsRenderingPreview(true);
        setErrorMessage(null);
        setPageCount(0);

        try {
            const arrayBuffer = await file.arrayBuffer();
            previewContainerRef.current.innerHTML = "";

            await renderAsync(arrayBuffer, previewContainerRef.current, undefined, {
                inWrapper: true,
                breakPages: true,
                ignoreHeight: false,
                ignoreWidth: false,
                ignoreFonts: false,
                renderHeaders: true,
                renderFooters: true,
            });

            // Detect rendered page sections
            const sections = previewContainerRef.current.querySelectorAll("section.docx");
            setPageCount(sections.length || 1);
        } catch (err: any) {
            console.error("Gagal merender pratinjau DOCX:", err);
            setErrorMessage("Gagal membaca struktur berkas Word. Pastikan berkas .docx tidak rusak.");
        } finally {
            setIsRenderingPreview(false);
        }
    }, []);

    const handleFiles = (newFiles: File[]) => {
        const docx = newFiles.filter(f => 
            f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            f.name.toLowerCase().endsWith(".docx")
        );
        if (docx.length === 0) return;

        setDocxFiles([docx[0]]);
        setPdfBlob(null);
        setErrorMessage(null);
        setConvertProgress(0);
        setProgressStatus("");
    };

    // Auto-render preview when a file is selected
    useEffect(() => {
        if (docxFiles.length > 0 && !pdfBlob) {
            renderDocxPreview(docxFiles[0]);
        }
    }, [docxFiles, pdfBlob, renderDocxPreview]);

    const generatePdf = async () => {
        if (docxFiles.length === 0 || !previewContainerRef.current) return;
        setIsProcessing(true);
        setPdfBlob(null);
        setErrorMessage(null);
        setConvertProgress(0);
        setProgressStatus("Mempersiapkan dokumen...");

        try {
            // If preview was not yet rendered, render it first
            let sections = Array.from(
                previewContainerRef.current.querySelectorAll("section.docx")
            ) as HTMLElement[];

            if (sections.length === 0) {
                setProgressStatus("Memproses layout Word...");
                await renderDocxPreview(docxFiles[0]);
                // Brief pause to allow DOM to finish painting
                await new Promise((r) => setTimeout(r, 200));
                sections = Array.from(
                    previewContainerRef.current.querySelectorAll("section.docx")
                ) as HTMLElement[];
            }

            const pdf = new jsPDF({
                unit: "mm",
                format: "a4",
                orientation: "portrait",
                compress: true,
            });

            if (sections.length > 0) {
                // Convert each authentic Word page section
                for (let i = 0; i < sections.length; i++) {
                    const pageEl = sections[i];
                    const pageNum = i + 1;
                    const pct = Math.round((pageNum / sections.length) * 100);
                    setConvertProgress(pct);
                    setProgressStatus(`Mengonversi halaman ${pageNum} dari ${sections.length}...`);

                    const canvas = await html2canvas(pageEl, {
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        backgroundColor: "#ffffff",
                        windowWidth: pageEl.scrollWidth,
                        windowHeight: pageEl.scrollHeight,
                    });

                    const imgData = canvas.toDataURL("image/jpeg", 0.95);

                    if (i > 0) {
                        pdf.addPage("a4", "portrait");
                    }

                    // A4 page dimensions in mm: 210 x 297
                    pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
                }
            } else {
                // Fallback for containers without sections
                setProgressStatus("Mengambil tangkapan layout...");
                const canvas = await html2canvas(previewContainerRef.current, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: "#ffffff",
                });
                const imgData = canvas.toDataURL("image/jpeg", 0.95);
                pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
            }

            setProgressStatus("Menyelesaikan berkas PDF...");
            const blob = pdf.output("blob");
            setPdfBlob(blob);
        } catch (e: any) {
            console.error("Gagal mengonversi Word ke PDF:", e);
            setErrorMessage("Terjadi kesalahan saat mengonversi dokumen Word ke PDF. Silakan coba kembali.");
        } finally {
            setIsProcessing(false);
            setConvertProgress(0);
            setProgressStatus("");
        }
    };

    const resetState = () => {
        setDocxFiles([]);
        setPdfBlob(null);
        setPageCount(0);
        setErrorMessage(null);
        setIsProcessing(false);
        setIsRenderingPreview(false);
        setConvertProgress(0);
        setProgressStatus("");
        if (previewContainerRef.current) {
            previewContainerRef.current.innerHTML = "";
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-8 w-full max-w-4xl mx-auto">
            {/* Scoped CSS for authentic Word pages display in dark theme */}
            <style jsx global>{`
                .docx-preview-container .docx-wrapper {
                    background: transparent !important;
                    padding: 0 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    gap: 28px !important;
                }
                .docx-preview-container .docx-wrapper > section.docx {
                    background: #ffffff !important;
                    color: #111827 !important;
                    box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.45), 0 4px 6px -2px rgba(0, 0, 0, 0.2) !important;
                    margin-bottom: 0px !important;
                    border-radius: 4px !important;
                    overflow: hidden !important;
                }
            `}</style>

            {/* Hidden Input for direct file picking */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        handleFiles(Array.from(e.target.files));
                    }
                }}
            />

            {!pdfBlob ? (
                <>
                    <Dropzone 
                        onFilesAccepted={handleFiles} 
                        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        title="Upload Dokumen Word (.docx)"
                        description="Pilih dokumen Microsoft Word yang ingin Anda konversi ke format PDF dengan tata letak asli presisi."
                        icons={
                            <div className="flex items-center gap-1.5">
                                <FileText className="w-5 h-5 text-blue-500" />
                                <span className="text-blue-500 font-bold">Dokumen Word (.docx)</span>
                            </div>
                        }
                    />

                    {docxFiles.length > 0 && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Error Alert */}
                            {errorMessage && (
                                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-400 text-sm">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {/* Header Berkas & Tombol Aksi */}
                            <div className="p-4 sm:p-5 rounded-2xl glass-panel border border-blue-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-base sm:text-lg font-bold truncate text-foreground">
                                            {docxFiles[0].name}
                                        </h2>
                                        <div className="flex items-center gap-2 text-xs text-foreground/60">
                                            <span>{(docxFiles[0].size / 1024 / 1024).toFixed(2)} MB</span>
                                            {pageCount > 0 && (
                                                <>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1 text-blue-400 font-medium">
                                                        <Layers className="w-3.5 h-3.5" />
                                                        {pageCount} Halaman
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => renderDocxPreview(docxFiles[0])}
                                        disabled={isRenderingPreview || isProcessing}
                                        className="px-3.5 py-2 rounded-xl bg-surface/80 border border-border/80 hover:bg-surface text-foreground/80 hover:text-foreground text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                                        title="Muat ulang pratinjau layout"
                                    >
                                        <Eye className="w-4 h-4 text-blue-400" />
                                        <span>Refresh Pratinjau</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={resetState}
                                        disabled={isProcessing}
                                        className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                                        title="Hapus berkas dan reset form"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Clear Berkas</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={generatePdf}
                                        disabled={isProcessing || isRenderingPreview}
                                        className={`px-5 py-2.5 rounded-xl font-bold text-white text-xs sm:text-sm transition-all shadow-md cursor-pointer flex items-center gap-2 ${
                                            isProcessing || isRenderingPreview
                                                ? "bg-blue-500/50 cursor-not-allowed" 
                                                : "bg-blue-600 hover:bg-blue-500 shadow-blue-500/25 hover:scale-105 active:scale-95"
                                        }`}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Mengonversi...</span>
                                            </>
                                        ) : (
                                            <span>Konversi ke PDF</span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Conversion Progress Bar */}
                            {isProcessing && (
                                <div className="p-4 rounded-xl glass-panel border border-blue-500/30 space-y-2 animate-fade-in">
                                    <div className="flex items-center justify-between text-xs font-semibold text-foreground/80">
                                        <span className="flex items-center gap-2 text-blue-400">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            {progressStatus || "Sedang memproses..."}
                                        </span>
                                        <span>{convertProgress}%</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-surface overflow-hidden">
                                        <div 
                                            className="h-full bg-linear-to-r from-blue-600 to-indigo-500 transition-all duration-300"
                                            style={{ width: `${convertProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Pratinjau Autentik Layout Dokumen Word */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-foreground/80 uppercase tracking-wide flex items-center gap-2">
                                        <span>Pratinjau Layout Dokumen Word</span>
                                        {pageCount > 0 && (
                                            <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                {pageCount} Halaman Sesuai Aslinya
                                            </span>
                                        )}
                                    </h3>
                                    {isRenderingPreview && (
                                        <span className="text-xs text-blue-400 flex items-center gap-1.5">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Memuat layout Word...
                                        </span>
                                    )}
                                </div>

                                <div className="p-4 sm:p-8 rounded-2xl bg-neutral-950/80 border border-border/80 min-h-100 max-h-[85vh] overflow-y-auto overflow-x-auto shadow-2xl flex flex-col items-center">
                                    <div 
                                        ref={previewContainerRef}
                                        className="docx-preview-container w-full flex flex-col items-center"
                                    />
                                    {isRenderingPreview && (
                                        <div className="py-20 flex flex-col items-center justify-center gap-3 text-foreground/60">
                                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                            <p className="text-sm">Menyiapkan pratinjau halaman Word...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* Output: Embedded Live PDF Viewer */
                <div className="space-y-6 animate-fade-in">
                    <PdfEmbeddedViewer
                        blob={pdfBlob}
                        fileName={`${docxFiles[0]?.name.replace(/\.docx$/i, "") || "dokumen"}.pdf`}
                        title="Dokumen PDF Hasil Konversi dari Word"
                        onClose={resetState}
                        accentColor="blue"
                    />

                    <div className="flex justify-center">
                        <button
                            type="button"
                            onClick={resetState}
                            className="px-6 py-2.5 rounded-xl bg-surface border border-border hover:bg-surface/80 text-foreground font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>Konversi Dokumen Word Lainnya</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
