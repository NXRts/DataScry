"use client";

import { useState } from "react";
import Dropzone from "@/components/ui/Dropzone";
import { mergeDocx } from "@/lib/mergeDocx";
import { ArrowUp, ArrowDown, FileText, Download, CheckCircle2, Sliders, RotateCcw } from "lucide-react";

export default function ClientMergeWord() {
    const [docxFiles, setDocxFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Neatness options
    const [insertPageBreak, setInsertPageBreak] = useState(true);
    const [trimEmptyParagraphs, setTrimEmptyParagraphs] = useState(true);

    const handleFiles = (newFiles: File[]) => {
        const validDocx = newFiles.filter(
            (f) =>
                f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                f.name.endsWith(".docx")
        );
        if (validDocx.length > 0) {
            setDocxFiles((prev) => [...prev, ...validDocx]);
            setErrorMsg(null);
        }
    };

    const moveFile = (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= docxFiles.length) return;

        setDocxFiles((prev) => {
            const updated = [...prev];
            const temp = updated[index];
            updated[index] = updated[targetIndex];
            updated[targetIndex] = temp;
            return updated;
        });
    };

    const handleMerge = async () => {
        if (docxFiles.length < 2) return;
        setIsProcessing(true);
        setErrorMsg(null);
        setMergedBlob(null);

        try {
            const blob = await mergeDocx(docxFiles, {
                insertPageBreak,
                trimEmptyParagraphs,
            });
            setMergedBlob(blob);
        } catch (err) {
            console.error("Gagal menggabungkan Word:", err);
            setErrorMsg("Gagal menggabungkan dokumen. Pastikan file Word (.docx) tidak korup.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (!mergedBlob) return;
        const url = URL.createObjectURL(mergedBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `datascry-merged-${Date.now()}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const resetState = () => {
        setDocxFiles([]);
        setMergedBlob(null);
        setErrorMsg(null);
        setIsProcessing(false);
    };

    return (
        <div className="space-y-12">
            {!mergedBlob ? (
                <>
                    <Dropzone
                        onFilesAccepted={handleFiles}
                        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        title="Upload Dokumen Word"
                        description="Pilih 2 atau lebih file Word (.docx) yang ingin Anda gabungkan menjadi satu."
                        icons={
                            <div className="flex items-center gap-1.5">
                                <FileText className="w-6 h-6 text-cyan-500" />
                                <span className="text-cyan-500 font-bold">Dokumen Word (.docx)</span>
                            </div>
                        }
                    />

                    {errorMsg && (
                        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-medium text-center">
                            {errorMsg}
                        </div>
                    )}

                    {docxFiles.length > 0 && (
                        <div className="space-y-6">
                            {/* Header & Primary Action */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight">
                                        Dokumen Terpilih ({docxFiles.length})
                                    </h2>
                                    <p className="text-xs text-foreground/60 mt-1">
                                        Urutkan file sesuai urutan penggabungan yang diinginkan.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={resetState}
                                        className="px-3.5 py-2 rounded-full border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                        title="Hapus semua berkas"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Clear Semua</span>
                                    </button>
                                    <button
                                        onClick={handleMerge}
                                        disabled={isProcessing || docxFiles.length < 2}
                                        className={`px-6 py-2.5 rounded-full font-bold text-white transition-all cursor-pointer ${
                                            isProcessing || docxFiles.length < 2
                                                ? "bg-cyan-500/50 cursor-not-allowed"
                                                : "bg-cyan-500 hover:bg-cyan-600 hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/25"
                                        }`}
                                    >
                                        {isProcessing
                                            ? "Menggabungkan..."
                                            : docxFiles.length < 2
                                            ? "Minimal 2 Word"
                                            : "Gabungkan Word"}
                                    </button>
                                </div>
                            </div>

                            {/* Options Panel for Neat Output */}
                            <div className="p-4 rounded-xl glass-panel border border-border/80 space-y-3 bg-surface/30">
                                <div className="flex items-center gap-2 text-sm font-bold text-foreground/80">
                                    <Sliders size={16} className="text-cyan-500" />
                                    <span>Pengaturan Kerapian Hasil Merging</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-foreground/80 pt-1">
                                    <label className="flex items-center gap-2.5 cursor-pointer selection:bg-transparent">
                                        <input
                                            type="checkbox"
                                            checked={insertPageBreak}
                                            onChange={(e) => setInsertPageBreak(e.target.checked)}
                                            className="w-4 h-4 rounded text-cyan-500 accent-cyan-500 cursor-pointer"
                                        />
                                        <span>Pisahkan setiap dokumen di halaman baru</span>
                                    </label>

                                    <label className="flex items-center gap-2.5 cursor-pointer selection:bg-transparent">
                                        <input
                                            type="checkbox"
                                            checked={trimEmptyParagraphs}
                                            onChange={(e) => setTrimEmptyParagraphs(e.target.checked)}
                                            className="w-4 h-4 rounded text-cyan-500 accent-cyan-500 cursor-pointer"
                                        />
                                        <span>Bersihkan paragraf & spasial kosong berlebih</span>
                                    </label>
                                </div>
                            </div>

                            {/* Files List */}
                            <div className="flex flex-col gap-3">
                                {docxFiles.map((file, idx) => (
                                    <div
                                        key={idx}
                                        className="p-4 rounded-xl glass-panel border border-border flex items-center justify-between gap-4 transition-all hover:bg-surface/50"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="shrink-0 w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold text-sm">
                                                {idx + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm truncate">{file.name}</p>
                                                <p className="text-xs text-foreground/50">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => moveFile(idx, "up")}
                                                disabled={idx === 0}
                                                className="p-1.5 rounded-lg hover:bg-surface text-foreground/60 hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                                title="Pindah ke Atas"
                                            >
                                                <ArrowUp size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moveFile(idx, "down")}
                                                disabled={idx === docxFiles.length - 1}
                                                className="p-1.5 rounded-lg hover:bg-surface text-foreground/60 hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                                title="Pindah ke Bawah"
                                            >
                                                <ArrowDown size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setDocxFiles((prev) => prev.filter((_, i) => i !== idx))
                                                }
                                                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-foreground/50 hover:text-rose-500 transition-colors ml-1"
                                                title="Hapus File"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-6 max-w-2xl mx-auto mt-8 animate-fade-in">
                    <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        Penggabungan Selesai!
                    </h3>
                    <p className="text-foreground/80 text-lg">
                        Dokumen Word Anda telah berhasil digabungkan secara rapi.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <button
                            onClick={handleDownload}
                            className="px-8 py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 w-full sm:w-auto flex items-center justify-center gap-2"
                        >
                            <Download size={20} />
                            Download Word ({(mergedBlob.size / 1024).toFixed(1)} KB)
                        </button>
                        <button
                            onClick={resetState}
                            className="px-8 py-4 rounded-xl bg-surface hover:bg-surface/80 text-foreground font-bold transition-all border border-border hover:scale-105 active:scale-95 w-full sm:w-auto"
                        >
                            Gabungkan Word Lain
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
