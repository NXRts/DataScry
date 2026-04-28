"use client";

import { useState } from "react";
import Dropzone from "@/components/ui/Dropzone";
import * as pdfjsLib from "pdfjs-dist";
import JSZip from "jszip";

// Setup PDF.js worker using unpkg/jsdelivr which replicates npm exactly
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function ClientPdfToJpg() {
    const [pdfs, setPdfs] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [zipBlob, setZipBlob] = useState<Blob | null>(null);

    const handleFiles = (newFiles: File[]) => {
        const pdfFiles = newFiles.filter(f => f.type === 'application/pdf');
        setPdfs(prev => [...prev, ...pdfFiles]);
    };

    const extractImages = async () => {
        if (pdfs.length === 0) return;
        setIsProcessing(true);
        setZipBlob(null);

        try {
            const zip = new JSZip();

            for (let i = 0; i < pdfs.length; i++) {
                const file = pdfs[i];
                const arrayBuffer = await file.arrayBuffer();

                // Load PDF using pdf.js
                const loadingTask = pdfjsLib.getDocument(new Uint8Array(arrayBuffer));
                const pdf = await loadingTask.promise;
                const numPages = pdf.numPages;

                for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 2.0 }); // High-quality scale

                    // Render PDF page to canvas
                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d");
                    if (!context) continue;

                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport,
                        canvas: canvas
                    };

                    await page.render(renderContext).promise;

                    // Convert canvas to blob
                    const blob = await new Promise<Blob | null>((resolve) => {
                        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95);
                    });

                    if (blob) {
                        const fileName = `${file.name.replace('.pdf', '')}_page-${pageNum}.jpg`;
                        zip.file(fileName, blob);
                    }
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            setZipBlob(content);

        } catch (e) {
            console.error("Error extracting PDF pages:", e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!zipBlob) return;
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `datascry-extracted-images-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const resetState = () => {
        setPdfs([]);
        setZipBlob(null);
        setIsProcessing(false);
    };

    return (
        <div className="space-y-12">
            {!zipBlob ? (
                <>
                    <Dropzone 
                        onFilesAccepted={handleFiles} 
                        accept="application/pdf"
                        title="Upload PDF"
                        description="Pilih dokumen PDF yang ingin Anda ubah menjadi gambar JPG."
                        icons={
                            <div className="flex items-center gap-1.5">
                                <span className="text-amber-500 font-bold">Dokumen PDF</span>
                            </div>
                        }
                    />

                    {pdfs.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold tracking-tight">PDF Terpilih ({pdfs.length})</h2>
                                <button
                                    onClick={extractImages}
                                    disabled={isProcessing}
                                    className={`px-6 py-2.5 rounded-full font-bold text-white transition-all ${isProcessing ? 'bg-amber-500/50 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 hover:scale-105'
                                        }`}
                                >
                                    {isProcessing ? 'Mengekstrak...' : 'Ekstrak Gambar (ZIP)'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pdfs.map((pdf, idx) => (
                                    <div key={idx} className="p-4 rounded-xl glass-panel border border-border flex items-center justify-between">
                                        <span className="font-semibold text-sm truncate max-w-[200px]">{pdf.name}</span>
                                        <button
                                            onClick={() => setPdfs(prev => prev.filter((_, i) => i !== idx))}
                                            className="text-foreground/50 hover:text-rose-500"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
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
                    <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">Ekstraksi Selesai!</h3>
                    <p className="text-foreground/80 text-lg">Semua halaman dari file PDF Anda telah berhasil diubah menjadi format JPG dan dibungkus menjadi file ZIP.</p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                        <button
                            onClick={handleDownload}
                            className="px-8 py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 w-full sm:w-auto"
                        >
                            Download File ZIP ({(zipBlob.size / 1024 / 1024).toFixed(2)} MB)
                        </button>
                        <button
                            onClick={resetState}
                            className="px-8 py-4 rounded-xl bg-surface hover:bg-surface/80 text-foreground font-bold transition-all border border-border hover:scale-105 active:scale-95 w-full sm:w-auto"
                        >
                            Pilih PDF Lain
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
