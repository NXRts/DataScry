"use client";

import { useState } from "react";
import Dropzone from "@/components/ui/Dropzone";
import * as pdfjsLib from "pdfjs-dist";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

// Setup PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function ClientPdfToWord() {
    const [pdfs, setPdfs] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [docxBlob, setDocxBlob] = useState(null);
    const [progress, setProgress] = useState(0);

    const handleFiles = (newFiles) => {
        const pdfFiles = newFiles.filter(f => f.type === 'application/pdf');
        setPdfs(prev => [...prev, ...pdfFiles]);
    };

    const extractTextFromPdf = async (arrayBuffer) => {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item) => item.str)
                .join(" ");
            fullText += pageText + "\n\n";
            
            setProgress(Math.round((i / pdf.numPages) * 100));
        }
        
        return fullText;
    };

    const convertToDocx = async (text, fileName) => {
        const paragraphs = text.split("\n\n").map(para => {
            const trimmed = para.trim();
            if (!trimmed) return new Paragraph({ text: "" });
            
            // Simple heuristic: if it's short and all caps, make it a heading
            if (trimmed.length < 100 && trimmed === trimmed.toUpperCase()) {
                return new Paragraph({
                    text: trimmed,
                    heading: HeadingLevel.HEADING_2,
                    alignment: AlignmentType.LEFT,
                });
            }
            
            return new Paragraph({
                children: [
                    new TextRun({
                        text: trimmed,
                        size: 24, // 12pt
                    }),
                ],
                spacing: {
                    after: 200,
                },
            });
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: paragraphs,
            }],
        });

        const buffer = await Packer.toBuffer(doc);
        return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    };

    const convertPdfToWord = async () => {
        if (pdfs.length === 0) return;
        setIsProcessing(true);
        setDocxBlob(null);
        setProgress(0);

        try {
            for (let i = 0; i < pdfs.length; i++) {
                const file = pdfs[i];
                const arrayBuffer = await file.arrayBuffer();
                
                const text = await extractTextFromPdf(arrayBuffer);
                const docxBlob = await convertToDocx(text, file.name);
                
                setDocxBlob(docxBlob);
            }
        } catch (e) {
            console.error("Error converting PDF to Word:", e);
        } finally {
            setIsProcessing(false);
            setProgress(0);
        }
    };

    const handleDownload = () => {
        if (!docxBlob || pdfs.length === 0) return;
        const url = URL.createObjectURL(docxBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${pdfs[0].name.replace('.pdf', '')}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const resetState = () => {
        setPdfs([]);
        setDocxBlob(null);
        setIsProcessing(false);
        setProgress(0);
    };

    return (
        <div className="space-y-12">
            {!docxBlob ? (
                <>
                    <Dropzone 
                        onFilesAccepted={handleFiles} 
                        accept="application/pdf"
                        title="Upload PDF"
                        description="Pilih dokumen PDF yang ingin Anda ubah menjadi dokumen Word (.docx)."
                        icons={
                            <div className="flex items-center gap-1.5">
                                <span className="text-blue-500 font-bold">Dokumen PDF</span>
                            </div>
                        }
                    />

                    {pdfs.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold tracking-tight">PDF Terpilih ({pdfs.length})</h2>
                                <button
                                    onClick={convertPdfToWord}
                                    disabled={isProcessing}
                                    className={`px-6 py-2.5 rounded-full font-bold text-white transition-all ${isProcessing ? 'bg-blue-500/50 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 hover:scale-105'
                                        }`}
                                >
                                    {isProcessing ? 'Mengonversi...' : 'Konversi ke Word'}
                                </button>
                            </div>

                            {isProcessing && (
                                <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
                                    <div 
                                        className="bg-blue-500 h-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            )}

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
                    <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">Konversi Selesai!</h3>
                    <p className="text-foreground/80 text-lg">Dokumen PDF Anda telah berhasil diubah menjadi format Word (.docx).</p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                        <button
                            onClick={handleDownload}
                            className="px-8 py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 w-full sm:w-auto"
                        >
                            Download File DOCX ({(docxBlob.size / 1024).toFixed(2)} KB)
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
