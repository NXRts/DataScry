"use client";

import { useState, useRef } from "react";
import Dropzone from "@/components/ui/Dropzone";
import mammoth from "mammoth";
import html2pdf from "html2pdf.js";

export default function ClientWordToPdf() {
    const [docxFiles, setDocxFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [previewHtml, setPreviewHtml] = useState<string>("");
    const previewRef = useRef<HTMLDivElement>(null);

    const handleFiles = (newFiles: File[]) => {
        const docx = newFiles.filter(f => 
            f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            f.name.endsWith('.docx')
        );
        setDocxFiles(prev => [...prev, ...docx]);
    };

    const convertDocxToHtml = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        return result.value;
    };

    const generatePdf = async () => {
        if (docxFiles.length === 0 || !previewRef.current) return;
        setIsProcessing(true);
        setPdfBlob(null);

        try {
            const element = previewRef.current;
            const opt = {
                margin: 10,
                filename: `${docxFiles[0].name.replace('.docx', '')}.pdf`,
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

            const pdf = await html2pdf().set(opt).from(element).save();
            
            // Get the blob for download
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

    const handleDownload = () => {
        if (!pdfBlob || docxFiles.length === 0) return;
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${docxFiles[0].name.replace('.docx', '')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const resetState = () => {
        setDocxFiles([]);
        setPdfBlob(null);
        setPreviewHtml("");
        setIsProcessing(false);
    };

    return (
        <div className="space-y-12">
            {!pdfBlob ? (
                <>
                    <Dropzone 
                        onFilesAccepted={handleFiles} 
                        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        title="Upload Word"
                        description="Pilih dokumen Word (.docx) yang ingin Anda ubah menjadi PDF."
                        icons={
                            <div className="flex items-center gap-1.5">
                                <span className="text-indigo-500 font-bold">Dokumen Word</span>
                            </div>
                        }
                    />

                    {docxFiles.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold tracking-tight">Word Terpilih ({docxFiles.length})</h2>
                                {!previewHtml ? (
                                    <button
                                        onClick={handlePreview}
                                        disabled={isProcessing}
                                        className={`px-6 py-2.5 rounded-full font-bold text-white transition-all ${isProcessing ? 'bg-indigo-500/50 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600 hover:scale-105'
                                            }`}
                                    >
                                        {isProcessing ? 'Memuat Preview...' : 'Lihat Preview'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={generatePdf}
                                        disabled={isProcessing}
                                        className={`px-6 py-2.5 rounded-full font-bold text-white transition-all ${isProcessing ? 'bg-indigo-500/50 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600 hover:scale-105'
                                            }`}
                                    >
                                        {isProcessing ? 'Mengonversi...' : 'Konversi ke PDF'}
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {docxFiles.map((file, idx) => (
                                    <div key={idx} className="p-4 rounded-xl glass-panel border border-border flex items-center justify-between">
                                        <span className="font-semibold text-sm truncate max-w-[200px]">{file.name}</span>
                                        <button
                                            onClick={() => setDocxFiles(prev => prev.filter((_, i) => i !== idx))}
                                            className="text-foreground/50 hover:text-rose-500"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {previewHtml && (
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold tracking-tight">Preview Dokumen</h3>
                                    <div 
                                        ref={previewRef}
                                        className="p-8 rounded-xl bg-white text-black min-h-[400px] prose max-w-none"
                                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-6 max-w-2xl mx-auto mt-8">
                    <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-2">
                        <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">Konversi Selesai!</h3>
                    <p className="text-foreground/80 text-lg">Dokumen Word Anda telah berhasil diubah menjadi format PDF.</p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                        <button
                            onClick={handleDownload}
                            className="px-8 py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 w-full sm:w-auto"
                        >
                            Download File PDF ({(pdfBlob.size / 1024).toFixed(2)} KB)
                        </button>
                        <button
                            onClick={resetState}
                            className="px-8 py-4 rounded-xl bg-surface hover:bg-surface/80 text-foreground font-bold transition-all border border-border hover:scale-105 active:scale-95 w-full sm:w-auto"
                        >
                            Pilih Word Lain
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
