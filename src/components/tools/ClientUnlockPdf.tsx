"use client";

import { useState, useRef } from "react";
import Dropzone from "@/components/ui/Dropzone";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";
import { decryptPDF, isEncrypted } from "@pdfsmaller/pdf-decrypt";
import {
    Unlock,
    Lock,
    ShieldCheck,
    Download,
    FileText,
    Key,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    Loader2,
    RotateCcw,
    ZoomIn,
    Sparkles,
    FileCheck2
} from "lucide-react";
import MediaLightboxModal, { LightboxItem } from "@/components/shared/MediaLightboxModal";

// Setup PDF.js worker using local public worker
if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

interface EncryptionInfo {
    encrypted: boolean;
    algorithm?: string;
    version?: number;
    revision?: number;
    keyLength?: number;
}

export default function ClientUnlockPdf() {
    const [file, setFile] = useState<File | null>(null);
    const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
    const [encryptionInfo, setEncryptionInfo] = useState<EncryptionInfo | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    
    // Password state
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Decrypted result state
    const [resultBlobUrl, setResultBlobUrl] = useState<string | null>(null);
    const [resultFileName, setResultFileName] = useState<string>("");
    const [resultSize, setResultSize] = useState<number>(0);
    const [pageCount, setPageCount] = useState<number>(0);
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null);

    const passwordInputRef = useRef<HTMLInputElement>(null);

    // Format bytes utility
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    // Clean reset state
    const handleReset = () => {
        if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl);
        if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);

        setFile(null);
        setFileBytes(null);
        setEncryptionInfo(null);
        setPassword("");
        setShowPassword(false);
        setIsDecrypting(false);
        setErrorMsg(null);
        setResultBlobUrl(null);
        setResultFileName("");
        setResultSize(0);
        setPageCount(0);
        setThumbnailUrl(null);
        setLightboxItem(null);
    };

    // Handle initial file selection & encryption detection
    const handleFilesSelected = async (files: File[]) => {
        if (files.length === 0) return;
        const selectedFile = files[0];

        handleReset();
        setFile(selectedFile);
        setIsAnalyzing(true);
        setErrorMsg(null);

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            setFileBytes(bytes);

            const encInfo = await isEncrypted(bytes);
            setEncryptionInfo(encInfo as EncryptionInfo);

            if (!encInfo.encrypted) {
                // Not encrypted: can immediately render thumbnail and inform user
                renderThumbnailAndInfo(bytes);
            } else {
                // Focus password input
                setTimeout(() => {
                    passwordInputRef.current?.focus();
                }, 100);
            }
        } catch (err: unknown) {
            console.error("Gagal menganalisis enkripsi PDF:", err);
            setErrorMsg("Gagal membaca berkas PDF. Pastikan berkas tidak rusak.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Render thumbnail of first page for preview and lightbox
    const renderThumbnailAndInfo = async (pdfData: Uint8Array) => {
        try {
            const loadingTask = pdfjsLib.getDocument({ data: pdfData });
            const pdfDoc = await loadingTask.promise;
            setPageCount(pdfDoc.numPages);

            const firstPage = await pdfDoc.getPage(1);
            const viewport = firstPage.getViewport({ scale: 1.5 });

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            if (context) {
                await firstPage.render({
                    canvasContext: context,
                    viewport: viewport,
                    canvas: canvas,
                }).promise;

                canvas.toBlob((blob) => {
                    if (blob) {
                        const thumbUrl = URL.createObjectURL(blob);
                        setThumbnailUrl(thumbUrl);
                    }
                }, "image/jpeg", 0.95);
            }
        } catch (err) {
            console.warn("Gagal merender thumbnail PDF:", err);
        }
    };

    // Execute Decryption
    const handleDecrypt = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!file || !fileBytes) return;

        if (!password) {
            setErrorMsg("Silakan masukkan kata sandi dokumen PDF terlebih dahulu.");
            passwordInputRef.current?.focus();
            return;
        }

        setIsDecrypting(true);
        setErrorMsg(null);

        try {
            // Decrypt using @pdfsmaller/pdf-decrypt in pure client-side Web Crypto
            const decryptedBytes = await decryptPDF(fileBytes, password);

            const blob = new Blob([decryptedBytes as unknown as BlobPart], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            const originalName = file.name.replace(/\.pdf$/i, "");
            setResultFileName(`${originalName}-unlocked.pdf`);
            setResultSize(blob.size);
            setResultBlobUrl(url);

            // Render first page thumbnail for lightbox inspection
            await renderThumbnailAndInfo(decryptedBytes);
        } catch (err: unknown) {
            console.error("Gagal membuka kunci PDF:", err);
            const message = err instanceof Error ? err.message : String(err);

            if (message.toLowerCase().includes("incorrect password") || message.toLowerCase().includes("password")) {
                setErrorMsg("Kata sandi salah. Pastikan huruf besar/kecil dan angka sesuai dengan password dokumen Anda.");
            } else {
                setErrorMsg(`Gagal mendekripsi PDF: ${message || "Format enkripsi tidak didukung atau berkas rusak."}`);
            }
            passwordInputRef.current?.focus();
        } finally {
            setIsDecrypting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Error Banner */}
            {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3 animate-fade-in shadow-lg">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="flex-1 font-medium">{errorMsg}</div>
                </div>
            )}

            {!file ? (
                /* Step 1: Upload PDF */
                <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-border/80 shadow-2xl">
                    <Dropzone
                        onFilesAccepted={handleFilesSelected}
                        accept="application/pdf"
                        title="Pilih atau Tarik Berkas PDF Terkunci ke Sini"
                        description="Mendukung e-statement bank, slip gaji, bukti pajak, atau dokumen berpassword apa saja"
                    />
                </div>
            ) : resultBlobUrl ? (
                /* Step 3: Success Screen (PDF Successfully Unlocked) */
                <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-border/80 shadow-2xl space-y-8 text-center animate-fade-in">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>

                    <div className="space-y-2 max-w-lg mx-auto">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                            <Sparkles className="w-3.5 h-3.5" />
                            Proteksi Password Berhasil Dihapus
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                            PDF Berhasil Dibuka Kunci!
                        </h2>
                        <p className="text-sm text-foreground/70 leading-relaxed">
                            Dokumen Anda kini 100% bebas dari kata sandi. Anda dapat mencetaknya, membagikannya, atau menyimpannya tanpa perlu memasukkan password lagi.
                        </p>
                    </div>

                    {/* Result Document Card */}
                    <div className="max-w-md mx-auto p-4 sm:p-5 rounded-2xl bg-surface/80 border border-border/80 text-left flex items-center gap-4 shadow-lg">
                        {thumbnailUrl ? (
                            <div 
                                onClick={() => setLightboxItem({
                                    url: thumbnailUrl,
                                    title: resultFileName,
                                    pageNumber: 1,
                                    totalPages: pageCount || 1,
                                    size: resultSize,
                                    mimeType: "application/pdf"
                                })}
                                className="relative w-16 h-22 rounded-lg bg-neutral-900 border border-border/60 overflow-hidden shrink-0 group cursor-pointer shadow-md"
                            >
                                <img
                                    src={thumbnailUrl}
                                    alt="Pratinjau PDF Terbuka"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <ZoomIn className="w-5 h-5 drop-shadow" />
                                </div>
                            </div>
                        ) : (
                            <div className="w-14 h-18 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400 shadow-md">
                                <FileCheck2 className="w-7 h-7" />
                            </div>
                        )}

                        <div className="min-w-0 flex-1 space-y-1">
                            <div className="text-sm font-bold text-foreground truncate" title={resultFileName}>
                                {resultFileName}
                            </div>
                            <div className="text-xs text-foreground/50 flex flex-wrap gap-x-3 gap-y-0.5">
                                <span>Ukuran: <strong className="text-foreground/80">{formatBytes(resultSize)}</strong></span>
                                {pageCount > 0 && (
                                    <span>Halaman: <strong className="text-foreground/80">{pageCount} Halaman</strong></span>
                                )}
                            </div>
                            <div className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium pt-0.5">
                                <Unlock className="w-3 h-3" />
                                Siap Cetak & Bebas Password
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto pt-2">
                        <a
                            href={resultBlobUrl}
                            download={resultFileName}
                            className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Download className="w-4 h-4" />
                            Unduh PDF Terbuka
                        </a>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-surface hover:bg-surface/80 border border-border/80 text-foreground/80 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Buka Berkas Lain
                        </button>
                    </div>
                </div>
            ) : encryptionInfo && !encryptionInfo.encrypted ? (
                /* Unencrypted Notice Screen */
                <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-border/80 shadow-2xl space-y-6 text-center animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 border-2 border-blue-500/30 flex items-center justify-center mx-auto text-blue-400 shadow-lg">
                        <FileCheck2 className="w-8 h-8" />
                    </div>

                    <div className="space-y-2 max-w-md mx-auto">
                        <h3 className="text-xl font-bold text-foreground">
                            Berkas Tidak Memiliki Kata Sandi
                        </h3>
                        <p className="text-sm text-foreground/60 leading-relaxed">
                            Dokumen <strong>{file.name}</strong> tidak terenkripsi atau sudah dalam keadaan terbuka. Berkas ini sudah dapat diakses dan dicetak secara langsung tanpa perlu proses pembukaan kunci.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xs mx-auto pt-2">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="w-full py-3 px-5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-content font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Pilih Berkas Lain
                        </button>
                    </div>
                </div>
            ) : (
                /* Step 2: Form Input Password & Decrypt Execution */
                <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-border/80 shadow-2xl space-y-8 animate-fade-in">
                    {/* Header File Info */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-surface/70 border border-border/70 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-12 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-500 shadow-md">
                                <Lock className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-sm font-bold text-foreground truncate" title={file.name}>
                                    {file.name}
                                </h3>
                                <div className="text-xs text-foreground/50 flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-0.5">
                                    <span>Ukuran: <strong className="text-foreground/80">{formatBytes(file.size)}</strong></span>
                                    {encryptionInfo?.algorithm && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium text-[10px] border border-amber-500/20">
                                            <Key className="w-2.5 h-2.5" />
                                            {encryptionInfo.algorithm}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleReset}
                            className="p-2.5 rounded-xl hover:bg-surface text-foreground/50 hover:text-foreground transition-colors shrink-0 cursor-pointer"
                            title="Ganti Berkas"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Password Input Form */}
                    <form onSubmit={handleDecrypt} className="space-y-6 max-w-xl mx-auto">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Key className="w-4 h-4 text-emerald-500" />
                                    Kata Sandi Dokumen PDF
                                </span>
                                <span className="text-xs text-foreground/40 font-normal">
                                    Wajib diisi
                                </span>
                            </label>

                            <div className="relative">
                                <input
                                    ref={passwordInputRef}
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (errorMsg) setErrorMsg(null);
                                    }}
                                    placeholder="Masukkan kata sandi PDF Anda..."
                                    className="w-full px-4 py-3.5 pr-12 rounded-2xl bg-surface/90 border border-border/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm font-medium text-foreground placeholder:text-foreground/40 outline-none shadow-inner"
                                    disabled={isDecrypting}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            <p className="text-[12px] text-foreground/50 leading-relaxed pt-1">
                                Masukkan kata sandi pembuka PDF (misalnya tanggal lahir, NIK, atau password yang diberikan oleh bank/institusi penerbit).
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!password || isDecrypting}
                            className={`w-full py-4 px-6 rounded-2xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2.5 ${
                                !password || isDecrypting
                                    ? "bg-surface/60 border border-border/60 text-foreground/30 cursor-not-allowed"
                                    : "bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/25 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                            }`}
                        >
                            {isDecrypting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Mendekripsi & Membuka Kunci Dokumen...</span>
                                </>
                            ) : (
                                <>
                                    <Unlock className="w-5 h-5" />
                                    <span>Buka Kunci & Hapus Password PDF</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Security & Privacy Reminder */}
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-foreground/60 flex items-start gap-3 max-w-xl mx-auto">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="leading-relaxed">
                            <span className="font-semibold text-emerald-400">Privasi Mutlak 100% Client-Side:</span> Kata sandi dan berkas PDF Anda diproses sepenuhnya di peramban lokal (in-memory) dan tidak pernah dikirim ke server mana pun.
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox Modal */}
            <MediaLightboxModal
                isOpen={!!lightboxItem}
                onClose={() => setLightboxItem(null)}
                item={lightboxItem}
                downloadLabel="Unduh PDF"
                accentColor="emerald"
                onDownload={() => {
                    if (resultBlobUrl) {
                        const a = document.createElement("a");
                        a.href = resultBlobUrl;
                        a.download = resultFileName;
                        a.click();
                    }
                }}
            />
        </div>
    );
}
