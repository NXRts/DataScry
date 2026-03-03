"use client";

import { useState } from "react";
import Dropzone from "@/components/ui/Dropzone";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

export default function ClientSplitPdf() {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedBlob, setExtractedBlob] = useState<Blob | null>(null);
    const [pageRange, setPageRange] = useState<string>("");

    const handleFiles = (newFiles: File[]) => {
        const pdfs = newFiles.filter(f => f.type === 'application/pdf');
        if (pdfs.length > 0) {
            setPdfFile(pdfs[0]); // Only handle one PDF at a time for splitting
            setExtractedBlob(null);
        }
    };

    const splitPdf = async () => {
        if (!pdfFile || !pageRange.trim()) return;
        setIsProcessing(true);
        setExtractedBlob(null);

        try {
            const fileBuffer = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(fileBuffer);
            const totalPages = pdfDoc.getPageCount();

            // Parse range (e.g., "1-3, 5, 7-9")
            const pagesToExtract = new Set<number>();
            const ranges = pageRange.split(',').map(s => s.trim());

            for (const r of ranges) {
                if (r.includes('-')) {
                    const [startStr, endStr] = r.split('-');
                    const start = parseInt(startStr);
                    const end = parseInt(endStr);
                    if (!isNaN(start) && !isNaN(end) && start > 0 && start <= end && end <= totalPages) {
                        for (let i = start; i <= end; i++) {
                            pagesToExtract.add(i - 1); // 0-indexed for pdf-lib
                        }
                    }
                } else {
                    const pageNum = parseInt(r);
                    if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
                        pagesToExtract.add(pageNum - 1);
                    }
                }
            }

            const indicesArray = Array.from(pagesToExtract).sort((a, b) => a - b);

            if (indicesArray.length === 0) {
                alert("Format rentang halaman tidak valid atau di luar cakupan halaman.");
                setIsProcessing(false);
                return;
            }

            // Create a brand new PDF with the copied extracted pages
            const newPdfDoc = await PDFDocument.create();
            const copiedPages = await newPdfDoc.copyPages(pdfDoc, indicesArray);
            copiedPages.forEach((page) => newPdfDoc.addPage(page));

            const pdfBytes = await newPdfDoc.save();
            const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
            setExtractedBlob(blob);

        } catch (e) {
            console.error("Error splitting PDF:", e);
            alert("Terjadi kesalahan saat memproses PDF.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!extractedBlob) return;
        const url = URL.createObjectURL(extractedBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `datascry-split-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-12">
            {!pdfFile ? (
                <Dropzone onFilesAccepted={handleFiles} />
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 glass-panel rounded-2xl border border-rose-500/20">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
                                <span className="text-rose-500 font-bold text-xl">PDF</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold truncate max-w-[300px] md:max-w-md">{pdfFile.name}</h2>
                                <p className="text-sm text-foreground/50">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setPdfFile(null); setExtractedBlob(null); }}
                            className="px-4 py-2 rounded-lg bg-surface border border-border hover:bg-rose-500/10 text-rose-500 transition-colors"
                        >
                            Ganti File
                        </button>
                    </div>

                    <div className="p-6 glass-panel rounded-2xl border border-border space-y-4">
                        <label className="block text-sm font-semibold text-foreground/80">Masukkan Halaman yang Ingin Diambil</label>
                        <input
                            type="text"
                            value={pageRange}
                            onChange={(e) => setPageRange(e.target.value)}
                            placeholder="Contoh: 1, 3-5, 8"
                            className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-shadow"
                        />
                        <p className="text-xs text-foreground/60 text-right">Gunakan koma (,) untuk memisahkan hal, dan setrip (-) untuk rentang.</p>

                        <button
                            onClick={splitPdf}
                            disabled={isProcessing || !pageRange.trim()}
                            className={`w-full py-4 mt-4 rounded-xl font-bold text-white transition-all shadow-lg ${isProcessing || !pageRange.trim()
                                ? 'bg-rose-500/40 cursor-not-allowed shadow-none'
                                : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25'
                                }`}
                        >
                            {isProcessing ? 'Memisahkan PDF...' : 'Ekstrak Halaman'}
                        </button>
                    </div>
                </div>
            )}

            {extractedBlob && (
                <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4">
                    <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Pemisahan Berhasil!</h3>
                    <p className="text-foreground/70 text-sm">Halaman PDF Anda telah diekstrak ke dalam dokumen PDF baru.</p>
                    <button
                        onClick={handleDownload}
                        className="px-8 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        Download PDF ({(extractedBlob.size / 1024 / 1024).toFixed(2)} MB)
                    </button>
                </div>
            )}
        </div>
    );
}
