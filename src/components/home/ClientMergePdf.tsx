"use client";

import { useState } from "react";
import Dropzone from "@/components/ui/Dropzone";
import { PDFDocument } from "pdf-lib";

export default function ClientMergePdf() {
    const [pdfs, setPdfs] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mergedPdf, setMergedPdf] = useState<Blob | null>(null);

    const handleFiles = (newFiles: File[]) => {
        const pdfFiles = newFiles.filter(f => f.type === 'application/pdf');
        setPdfs(prev => [...prev, ...pdfFiles]);
    };

    const mergePdfs = async () => {
        if (pdfs.length < 2) return;
        setIsProcessing(true);
        setMergedPdf(null);

        try {
            const mergedPdfDoc = await PDFDocument.create();

            for (const file of pdfs) {
                const fileBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(fileBuffer);
                const copiedPages = await mergedPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
                copiedPages.forEach((page) => mergedPdfDoc.addPage(page));
            }

            const pdfBytes = await mergedPdfDoc.save();
            const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
            setMergedPdf(blob);
        } catch (e) {
            console.error("Error merging PDFs:", e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!mergedPdf) return;
        const url = URL.createObjectURL(mergedPdf);
        const a = document.createElement("a");
        a.href = url;
        a.download = `datascry-merged-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-12">
            <Dropzone onFilesAccepted={handleFiles} />

            {pdfs.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold tracking-tight">Dokumen untuk Digabung ({pdfs.length})</h2>
                        <button
                            onClick={mergePdfs}
                            disabled={isProcessing || pdfs.length < 2}
                            className={`px-6 py-2.5 rounded-full font-bold text-white transition-all ${isProcessing || pdfs.length < 2
                                ? 'bg-purple-500/50 cursor-not-allowed'
                                : 'bg-purple-500 hover:bg-purple-600 hover:scale-105'
                                }`}
                        >
                            {isProcessing ? 'Menggabungkan...' : pdfs.length < 2 ? 'Minimal 2 PDF' : 'Gabungkan PDF'}
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {pdfs.map((pdf, idx) => (
                            <div key={idx} className="p-4 rounded-xl glass-panel border border-border flex items-center gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{pdf.name}</p>
                                    <p className="text-xs text-foreground/50">{(pdf.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button
                                    onClick={() => setPdfs(prev => prev.filter((_, i) => i !== idx))}
                                    className="text-foreground/50 hover:text-rose-500 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {mergedPdf && (
                <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4">
                    <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Penggabungan Berhasil!</h3>
                    <p className="text-foreground/70 text-sm">Dokumen-dokumen Anda telah menjadi satu file utuh.</p>
                    <button
                        onClick={handleDownload}
                        className="px-8 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        Download PDF ({(mergedPdf.size / 1024 / 1024).toFixed(2)} MB)
                    </button>
                </div>
            )}
        </div>
    );
}
