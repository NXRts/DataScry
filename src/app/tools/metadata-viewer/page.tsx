"use client";

import { useState, useRef } from "react";
import Dropzone from "@/components/ui/Dropzone";
import ExifReader from "exifreader";
import { PDFDocument } from "pdf-lib";
import { FileSearch, ArrowLeft, Loader2, RotateCcw, FolderOpen, FileText, Copy, Check } from "lucide-react";
import Link from "next/link";
import Header from "@/components/layout/Header";

interface MetadataItem {
    key: string;
    value: string;
    description?: string;
}

export default function MetadataViewerPage() {
    const [file, setFile] = useState<File | null>(null);
    const [metadata, setMetadata] = useState<MetadataItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClear = () => {
        setFile(null);
        setMetadata([]);
        setError(null);
        setIsLoading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handlePickFileDirectly = () => {
        fileInputRef.current?.click();
    };

    const handleCopyAll = async () => {
        if (metadata.length === 0) return;
        const text = metadata.map(m => `${m.key}: ${m.value}`).join('\n');
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback if clipboard API is restricted
            const textarea = document.createElement("textarea");
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleFiles = async (files: File[]) => {
        if (files.length === 0) return;
        const selectedFile = files[0];
        setFile(selectedFile);
        setIsLoading(true);
        setError(null);
        setMetadata([]);

        try {
            const extractedMetadata: MetadataItem[] = [];

            // File Basic Info
            extractedMetadata.push({ key: "File Name", value: selectedFile.name });
            extractedMetadata.push({ key: "File Size", value: `${(selectedFile.size / 1024).toFixed(2)} KB` });
            extractedMetadata.push({ key: "File Type", value: selectedFile.type || "Unknown" });
            extractedMetadata.push({ key: "Last Modified", value: new Date(selectedFile.lastModified).toLocaleString() });

            if (selectedFile.type.startsWith("image/")) {
                // Parse EXIF Data
                const tags = await ExifReader.load(selectedFile, { expanded: true });

                // General EXIF
                if (tags.exif) {
                    Object.entries(tags.exif).forEach(([key, tag]) => {
                        if (tag && tag.description && typeof tag.description === 'string' && tag.description.trim() !== '') {
                            extractedMetadata.push({ key: `EXIF: ${key}`, value: tag.description });
                        }
                    });
                }

                // GPS Data
                if (tags.gps) {
                    if (tags.gps.Latitude && tags.gps.Longitude) {
                        extractedMetadata.push({ key: "GPS Latitude", value: String(tags.gps.Latitude) });
                        extractedMetadata.push({ key: "GPS Longitude", value: String(tags.gps.Longitude) });
                    }
                }

                // File attributes
                if (tags.file) {
                    Object.entries(tags.file).forEach(([key, tag]) => {
                        if (tag && tag.description && typeof tag.description === 'string' && tag.description.trim() !== '') {
                            extractedMetadata.push({ key: `File: ${key}`, value: String(tag.description) });
                        }
                    });
                }
            } else if (selectedFile.type === "application/pdf") {
                // Parse PDF Metadata
                const arrayBuffer = await selectedFile.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

                const title = pdfDoc.getTitle();
                if (title) extractedMetadata.push({ key: "PDF Title", value: title });

                const author = pdfDoc.getAuthor();
                if (author) extractedMetadata.push({ key: "PDF Author", value: author });

                const subject = pdfDoc.getSubject();
                if (subject) extractedMetadata.push({ key: "PDF Subject", value: subject });

                const creator = pdfDoc.getCreator();
                if (creator) extractedMetadata.push({ key: "PDF Creator", value: creator });

                const producer = pdfDoc.getProducer();
                if (producer) extractedMetadata.push({ key: "PDF Producer", value: producer });

                const creationDate = pdfDoc.getCreationDate();
                if (creationDate) extractedMetadata.push({ key: "PDF Creation Date", value: creationDate.toLocaleString() });

                const modificationDate = pdfDoc.getModificationDate();
                if (modificationDate) extractedMetadata.push({ key: "PDF Modification Date", value: modificationDate.toLocaleString() });

                extractedMetadata.push({ key: "Total Pages", value: String(pdfDoc.getPageCount()) });
            } else {
                extractedMetadata.push({ key: "Notice", value: "Extended metadata extraction is only supported for Images (EXIF) and PDFs." });
            }

            setMetadata(extractedMetadata);
        } catch (err) {
            console.error("Failed to read metadata:", err);
            setError("Gagal membaca metadata dari file ini. Pastikan file valid atau tidak terenkripsi rusak.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8 md:py-16">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Header Top */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/#tools" className="p-2 hover:bg-surface rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                                <FileSearch className="w-8 h-8 text-blue-500" />
                                Penampil Metadata (EXIF/PDF Info)
                            </h1>
                            <p className="text-foreground/60 mt-1">
                                Intip informasi tersembunyi (EXIF, Kreator, GPS) pada foto dan dokumen Anda 100% lokal.
                            </p>
                        </div>
                    </div>

                    {!file ? (
                        <div className="animate-fade-in">
                            <Dropzone onFilesAccepted={handleFiles} />
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            {/* Hidden direct file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        handleFiles(Array.from(e.target.files));
                                    }
                                }}
                            />

                            {/* File Status & Action Banner */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface/60 p-4 sm:p-5 rounded-2xl border border-border/60 backdrop-blur-md shadow-sm">
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-semibold text-base sm:text-lg text-foreground truncate">{file.name}</span>
                                        <div className="flex items-center gap-2 text-xs text-foreground/60 mt-0.5">
                                            <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                                Pemrosesan Lokal Selesai
                                            </span>
                                            <span>•</span>
                                            <span>{(file.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 shrink-0">
                                    <button
                                        type="button"
                                        onClick={handleClear}
                                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-foreground/80 hover:text-rose-400 bg-surface hover:bg-rose-500/10 border border-border/80 hover:border-rose-500/30 rounded-xl transition-all active:scale-95 cursor-pointer"
                                        title="Hapus tampilan dan kembali ke menu upload"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        <span>Clear File</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handlePickFileDirectly}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-primary hover:bg-primary-focus rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                                        title="Buka file gambar atau PDF lain langsung dari perangkat"
                                    >
                                        <FolderOpen className="w-4 h-4" />
                                        <span>Bedah File Lain</span>
                                    </button>
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-surface/30 rounded-2xl border border-border/50">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                                    <p className="text-foreground/70 animate-pulse">Membedah partikel metadata...</p>
                                </div>
                            ) : error ? (
                                <div className="p-6 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-center space-y-4">
                                    <p>{error}</p>
                                    <button
                                        type="button"
                                        onClick={handleClear}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-foreground bg-surface border border-border rounded-xl hover:bg-surface/80"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        <span>Coba File Lain</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="glass-panel overflow-hidden rounded-2xl border border-border/50 shadow-xl">
                                    <div className="bg-surface/80 p-4 border-b border-border/50 flex flex-wrap justify-between items-center gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <h3 className="font-bold tracking-tight text-foreground">Properti Ditemukan</h3>
                                            <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                                                {metadata.length} Entri
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={handleCopyAll}
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface hover:bg-surface/80 border border-border/60 hover:border-primary/50 text-foreground/80 hover:text-primary transition-all active:scale-95 cursor-pointer"
                                            >
                                                {copied ? (
                                                    <>
                                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                        <span className="text-emerald-400 font-bold">Tersalin!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3.5 h-3.5" />
                                                        <span>Salin Semua</span>
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleClear}
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface hover:bg-rose-500/10 border border-border/60 hover:border-rose-500/30 text-foreground/70 hover:text-rose-400 transition-all active:scale-95 cursor-pointer"
                                                title="Bersihkan metadata untuk membedah file selanjutnya"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                                <span>Clear</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-surface/50 text-foreground/60 text-xs uppercase border-b border-border/30">
                                                <tr>
                                                    <th className="px-6 py-4 font-semibold w-1/3">Properti / Kunci</th>
                                                    <th className="px-6 py-4 font-semibold">Nilai</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/30">
                                                {metadata.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-surface/30 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-foreground/80 break-all border-r border-border/10">
                                                            {item.key}
                                                        </td>
                                                        <td className="px-6 py-4 text-foreground/90 font-mono text-xs break-all">
                                                            {item.value}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {metadata.length === 0 && (
                                                    <tr>
                                                        <td colSpan={2} className="px-6 py-12 text-center text-foreground/50 italic">
                                                            Tidak ada metadata khusus ditemukan, mungkin sudah pernah discrub.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Table Footer Actions */}
                                    <div className="bg-surface/40 p-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                                        <span className="text-xs text-foreground/50">
                                            Menampilkan {metadata.length} baris data tersembunyi.
                                        </span>
                                        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                                            <button
                                                type="button"
                                                onClick={handleClear}
                                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-surface border border-border/60 hover:bg-rose-500/10 hover:border-rose-500/30 text-foreground/80 hover:text-rose-400 transition-all active:scale-95 cursor-pointer"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                                <span>Clear / Reset</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handlePickFileDirectly}
                                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-focus rounded-xl shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                                            >
                                                <FolderOpen className="w-3.5 h-3.5" />
                                                <span>Bedah File Lain</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
