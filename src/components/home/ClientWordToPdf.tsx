"use client";

import { useState, useRef } from "react";
import Dropzone from "@/components/ui/Dropzone";
import mammoth from "mammoth";
import html2pdf from "html2pdf.js";
import { FileText, RotateCcw, Sparkles, Download, Eye, CheckCircle2 } from "lucide-react";
import PdfEmbeddedViewer from "@/components/shared/PdfEmbeddedViewer";

export default function ClientWordToPdf() {
    const [docxFiles, setDocxFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [previewHtml, setPreviewHtml] = useState<string>("");
    const previewRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = (newFiles: File[]) => {
        const docx = newFiles.filter(f => 
            f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            f.name.toLowerCase().endsWith('.docx')
        );
        setDocxFiles(prev => [...prev, ...docx]);
        setPdfBlob(null);
    };

    const convertDocxToHtml = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        return result.value;
    };

    const generatePdf = async () => {
        if (docxFiles.length === 0) return;
        setIsProcessing(true);
        setPdfBlob(null);

        try {
            // First ensure we have HTML preview to render from
            let htmlToRender = previewHtml;
            if (!htmlToRender) {
                htmlToRender = await convertDocxToHtml(docxFiles[0]);
                setPreviewHtml(htmlToRender);
            }

            // Small delay to allow DOM to render HTML preview if not yet mounted
            await new Promise(r => setTimeout(r, 100));

            const element = previewRef.current;
            if (!element) {
                setIsProcessing(false);
                return;
            }

            const opt = {
                margin: 10,
                filename: `${docxFiles[0].name.replace(/\.docx$/i, '')}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { 
                    scale: 2, 
                    useCORS: true,
                    logging: false
                },
                jsPDF: { 
                    unit: 'mm', 
                    format: 'a4', 
                    orientation: 'portrait' as const 
                },
                pagebreak: { mode: 'avoid-all', before: '.page-break' }
            };

            const blob = await html2pdf().set(opt).from(element).output('blob');
            setPdfBlob(blob);
        } catch (e) {
            console.error("Error converting Word to PDF:", e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePreview = async () => {
        if (docxFiles.length === 0) return;
        setIsProcessing(true);
        
        try {
            const html = await convertDocxToHtml(docxFiles[0]);
            setPreviewHtml(html);
        } catch (e) {
            console.error("Error generating preview:", e);
        } finally {
            setIsProcessing(false);
        }
    };

    const resetState = () => {
        setDocxFiles([]);
        setPdfBlob(null);
        setPreviewHtml("");
        setIsProcessing(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-8 w-full max-w-4xl mx-auto">
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
                        description="Pilih dokumen Microsoft Word yang ingin Anda konversi ke format PDF secara instan."
                        icons={
                            <div className="flex items-center gap-1.5">
                                <FileText className="w-5 h-5 text-blue-500" />
                                <span className="text-blue-500 font-bold">Dokumen Word (.docx)</span>
                            </div>
                        }
                    />

                    {docxFiles.length > 0 && (
                        <div className="space-y-6 animate-fade-in">
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
                                        <p className="text-xs text-foreground/60">
                                            {(docxFiles[0].size / 1024 / 1024).toFixed(2)} MB • Siap dikonversi
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={handlePreview}
                                        disabled={isProcessing}
                                        className="px-3.5 py-2 rounded-xl bg-surface/80 border border-border/80 hover:bg-surface text-foreground/80 hover:text-foreground text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                    >
                                        <Eye className="w-4 h-4 text-blue-400" />
                                        <span>Pratinjau HTML</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={resetState}
                                        className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                        title="Hapus berkas dan reset form"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Clear Berkas</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={generatePdf}
                                        disabled={isProcessing}
                                        className={`px-5 py-2.5 rounded-xl font-bold text-white text-xs sm:text-sm transition-all shadow-md cursor-pointer ${
                                            isProcessing 
                                                ? "bg-blue-500/50 cursor-not-allowed" 
                                                : "bg-blue-600 hover:bg-blue-500 shadow-blue-500/25 hover:scale-105 active:scale-95"
                                        }`}
                                    >
                                        {isProcessing ? "Mengonversi..." : "Konversi ke PDF"}
                                    </button>
                                </div>
                            </div>

                            {/* Pratinjau Teks Dokumen */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-foreground/80 uppercase tracking-wide">
                                    Pratinjau Layout Dokumen Word
                                </h3>
                                <div 
                                    ref={previewRef}
                                    className="p-6 sm:p-10 rounded-2xl bg-white text-neutral-900 min-h-87.5 shadow-2xl border border-border/80 prose max-w-none overflow-x-auto"
                                    dangerouslySetInnerHTML={{ 
                                        __html: previewHtml || "<p class='text-neutral-400 italic'>Klik tombol 'Pratinjau HTML' atau langsung 'Konversi ke PDF' untuk melihat isi dokumen...</p>" 
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* Output: Embedded Live PDF Viewer */
                <div className="space-y-6 animate-fade-in">
                    <PdfEmbeddedViewer
                        blob={pdfBlob}
                        fileName={`${docxFiles[0]?.name.replace(/\.docx$/i, '') || "dokumen"}.pdf`}
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
