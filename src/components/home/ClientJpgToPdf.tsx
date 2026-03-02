"use client";

import { useRef, useState } from "react";
import Dropzone from "@/components/ui/Dropzone";
import FilePreview from "@/components/ui/FilePreview";
import { PDFDocument } from "pdf-lib";

export default function ClientJpgToPdf() {
    const [images, setImages] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [completePdf, setCompletePdf] = useState<Blob | null>(null);

    const handleFiles = (newFiles: File[]) => {
        // Only accept images
        const imgFiles = newFiles.filter(f => f.type.startsWith('image/'));
        setImages(prev => [...prev, ...imgFiles]);
    };

    const generatePDF = async () => {
        if (images.length === 0) return;
        setIsProcessing(true);
        setCompletePdf(null);

        try {
            const pdfDoc = await PDFDocument.create();

            for (const file of images) {
                const imageBytes = await file.arrayBuffer();
                let image;

                if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
                    image = await pdfDoc.embedJpg(imageBytes);
                } else if (file.type === 'image/png') {
                    image = await pdfDoc.embedPng(imageBytes);
                } else {
                    // Unsupported natively by simple pdf-lib out of the box (e.g WebP), 
                    // a complete solution requires canvas rendering first, which we fallback to skipping here or throwing error
                    console.warn(`Unsupported exact format for direct injection: ${file.type}. Skipping.`);
                    continue;
                }

                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
            setCompletePdf(blob);
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!completePdf) return;
        const url = URL.createObjectURL(completePdf);
        const a = document.createElement("a");
        a.href = url;
        a.download = `privakit-images-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const resetState = () => {
        setImages([]);
        setCompletePdf(null);
        setIsProcessing(false);
    };

    return (
        <div className="space-y-12">
            {!completePdf ? (
                <>
                    <Dropzone onFilesAccepted={handleFiles} />

                    {images.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold tracking-tight">Foto Terpilih ({images.length})</h2>
                                <button
                                    onClick={generatePDF}
                                    disabled={isProcessing}
                                    className={`px-6 py-2.5 rounded-full font-bold text-white transition-all ${isProcessing ? 'bg-amber-500/50 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 hover:scale-105'
                                        }`}
                                >
                                    {isProcessing ? 'Memproses...' : 'Gabungkan ke PDF'}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {images.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden glass-panel border border-border group">
                                        <img src={URL.createObjectURL(img)} alt={img.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <button
                                            onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                                            className="absolute top-2 right-2 p-1.5 bg-rose-500/90 text-white rounded-lg hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                                        >
                                            ✕
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                            <p className="text-white text-xs truncate drop-shadow-md">{img.name}</p>
                                        </div>
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
                    <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">PDF Berhasil Dibuat!</h3>
                    <p className="text-foreground/80 text-lg">File PDF gabungan dari gambar-gambar Anda telah siap.</p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                        <button
                            onClick={handleDownload}
                            className="px-8 py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 w-full sm:w-auto"
                        >
                            Download PDF ({(completePdf.size / 1024 / 1024).toFixed(2)} MB)
                        </button>
                        <button
                            onClick={resetState}
                            className="px-8 py-4 rounded-xl bg-surface hover:bg-surface/80 text-foreground font-bold transition-all border border-border hover:scale-105 active:scale-95 w-full sm:w-auto"
                        >
                            Buat PDF Lain
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
