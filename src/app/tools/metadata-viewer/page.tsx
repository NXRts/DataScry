"use client";

import { useState } from "react";
import Dropzone from "@/components/ui/Dropzone";
import ExifReader from "exifreader";
import { PDFDocument } from "pdf-lib";
import { FileSearch, ArrowLeft, Loader2 } from "lucide-react";
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
                            <div className="flex justify-between items-center bg-surface/50 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
                                <div className="flex flex-col">
                                    <span className="font-medium text-lg">{file.name}</span>
                                    <span className="text-sm text-emerald-500 flex items-center gap-1">
                                        Pemrosesan Lokal Selesai
                                    </span>
                                </div>
                                <button
                                    onClick={() => setFile(null)}
                                    className="px-4 py-2 text-sm font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-colors"
                                >
                                    Pilih File Lain
                                </button>
                            </div>

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-surface/30 rounded-2xl border border-border/50">
                                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                                    <p className="text-foreground/70 animate-pulse">Membedah partikel metadata...</p>
                                </div>
                            ) : error ? (
                                <div className="p-6 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-center">
                                    {error}
                                </div>
                            ) : (
                                <div className="glass-panel overflow-hidden rounded-2xl border border-border/50 shadow-xl">
                                    <div className="bg-surface/80 p-4 border-b border-border/50 flex justify-between items-center">
                                        <h3 className="font-bold tracking-tight">Properti Ditemukan</h3>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => {
                                                    const text = metadata.map(m => `${m.key}: ${m.value}`).join('\n');
                                                    navigator.clipboard.writeText(text);
                                                    alert("Metadata disalin ke clipboard!");
                                                }}
                                                className="text-xs font-bold text-primary hover:underline px-3 py-1"
                                            >
                                                Salin Semua
                                            </button>
                                            <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                                                {metadata.length} Entri
                                            </span>
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
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
