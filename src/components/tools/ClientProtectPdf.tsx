"use client";

import { useState, useMemo } from "react";
import Dropzone from "@/components/ui/Dropzone";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";
import { encryptPDF, AlreadyEncryptedError } from "@pdfsmaller/pdf-encrypt";
import {
    Lock,
    Unlock,
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
    Sliders,
    Printer,
    Copy,
    Edit3,
    CheckSquare,
    Square,
    HelpCircle,
    Sparkles,
    ZoomIn
} from "lucide-react";
import MediaLightboxModal, { LightboxItem } from "@/components/shared/MediaLightboxModal";

// Setup PDF.js worker using local public worker
if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

type Algorithm = "AES-256" | "RC4";

export default function ClientProtectPdf() {
    const [file, setFile] = useState<File | null>(null);
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [pageCount, setPageCount] = useState<number>(0);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null);

    // Password fields
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

    // Advanced permissions & options
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
    const [algorithm, setAlgorithm] = useState<Algorithm>("AES-256");
    const [ownerPassword, setOwnerPassword] = useState<string>("");
    const [showOwnerPassword, setShowOwnerPassword] = useState<boolean>(false);
    const [allowPrinting, setAllowPrinting] = useState<boolean>(true);
    const [allowCopying, setAllowCopying] = useState<boolean>(false);
    const [allowModifying, setAllowModifying] = useState<boolean>(false);
    const [allowFillingForms, setAllowFillingForms] = useState<boolean>(true);

    // Processing & result state
    const [isEncrypting, setIsEncrypting] = useState<boolean>(false);
    const [resultBlobUrl, setResultBlobUrl] = useState<string | null>(null);
    const [resultFileName, setResultFileName] = useState<string>("");
    const [resultSize, setResultSize] = useState<number>(0);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Password strength calculation
    const strengthScore = useMemo(() => {
        if (!password) return 0;
        let score = 0;
        if (password.length >= 6) score += 1;
        if (password.length >= 10) score += 1;
        if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        return Math.min(score, 4);
    }, [password]);

    const strengthLabel = useMemo(() => {
        switch (strengthScore) {
            case 0:
            case 1:
                return { text: "Sangat Lemah", color: "text-rose-500", bg: "bg-rose-500", percent: 25 };
            case 2:
                return { text: "Sedang", color: "text-amber-500", bg: "bg-amber-500", percent: 50 };
            case 3:
                return { text: "Kuat", color: "text-blue-500", bg: "bg-blue-500", percent: 75 };
            case 4:
                return { text: "Sangat Kuat", color: "text-emerald-500", bg: "bg-emerald-500", percent: 100 };
            default:
                return { text: "Lemah", color: "text-rose-500", bg: "bg-rose-500", percent: 20 };
        }
    }, [strengthScore]);

    // Handle File Drop / Select
    const handleFilesSelected = async (files: File[]) => {
        if (files.length === 0) return;
        const selected = files[0];
        if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
            setErrorMsg("Format file tidak didukung. Harap pilih dokumen berformat PDF.");
            return;
        }

        setFile(selected);
        setErrorMsg(null);
        setResultBlobUrl(null);
        setIsAnalyzing(true);

        try {
            const arrayBuffer = await selected.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
            const pdf = await loadingTask.promise;

            setPageCount(pdf.numPages);

            // Render page 1 thumbnail
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 0.5 });
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            if (ctx) {
                await page.render({
                    canvasContext: ctx,
                    viewport: viewport,
                    canvas: canvas,
                }).promise;
                setThumbnailUrl(canvas.toDataURL("image/jpeg", 0.8));
            }
        } catch (err: unknown) {
            console.error("PDF preview error:", err);
            // Check if already password protected
            if (err && typeof err === "object" && "name" in err && err.name === "PasswordException") {
                setErrorMsg("Dokumen ini sudah terkunci kata sandi sebelumnya. Buka kuncinya terlebih dahulu sebelum memproteksi ulang.");
                setFile(null);
            } else {
                setThumbnailUrl(null);
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Reset everything
    const handleReset = () => {
        if (resultBlobUrl) {
            URL.revokeObjectURL(resultBlobUrl);
        }
        setFile(null);
        setThumbnailUrl(null);
        setPageCount(0);
        setPassword("");
        setConfirmPassword("");
        setOwnerPassword("");
        setResultBlobUrl(null);
        setErrorMsg(null);
    };

    // Encrypt PDF
    const handleEncryptPdf = async () => {
        if (!file) return;

        // Validation
        if (!password) {
            setErrorMsg("Kata sandi pembuka dokumen wajib diisi.");
            return;
        }

        if (password.length < 3) {
            setErrorMsg("Kata sandi terlalu pendek. Gunakan minimal 3 karakter (disarankan 8+ karakter).");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg("Konfirmasi kata sandi tidak cocok. Harap periksa kembali.");
            return;
        }

        if (showAdvanced && ownerPassword && ownerPassword === password) {
            setErrorMsg("Kata Sandi Pemilik (Owner) tidak boleh sama persis dengan Kata Sandi Pembuka (User) sesuai standar spesifikasi PDF.");
            return;
        }

        setIsEncrypting(true);
        setErrorMsg(null);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const inputBytes = new Uint8Array(arrayBuffer);

            const options = {
                algorithm: algorithm,
                ownerPassword: showAdvanced && ownerPassword ? ownerPassword : undefined,
                allowPrinting: showAdvanced ? allowPrinting : true,
                allowCopying: showAdvanced ? allowCopying : false,
                allowModifying: showAdvanced ? allowModifying : false,
                allowFillingForms: showAdvanced ? allowFillingForms : true,
            };

            const encryptedBytes = await encryptPDF(inputBytes, password, options);

            const blob = new Blob([encryptedBytes as unknown as BlobPart], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            const originalName = file.name.replace(/\.pdf$/i, "");
            setResultFileName(`${originalName}-protected.pdf`);
            setResultSize(blob.size);
            setResultBlobUrl(url);
        } catch (err: unknown) {
            console.error("Encryption error:", err);
            if (err instanceof AlreadyEncryptedError) {
                setErrorMsg("Gagal: Berkas PDF ini sudah terenkripsi sebelumnya.");
            } else if (err instanceof Error) {
                setErrorMsg(`Gagal mengenkripsi PDF: ${err.message}`);
            } else {
                setErrorMsg("Terjadi kesalahan tidak terduga saat memproses proteksi PDF.");
            }
        } finally {
            setIsEncrypting(false);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
                        title="Pilih atau Tarik Berkas PDF ke Sini"
                        description="Mendukung dokumen PDF apa saja untuk dikunci dengan kata sandi rahasia"
                    />
                </div>
            ) : resultBlobUrl ? (
                /* Step 3: Success Result Screen */
                <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-border/80 shadow-2xl space-y-8 text-center animate-fade-in">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>

                    <div className="space-y-2 max-w-xl mx-auto">
                        <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                            PDF Berhasil Dikunci & Terenkripsi!
                        </h2>
                        <p className="text-foreground/70 text-sm sm:text-base">
                            Dokumen Anda kini dilindungi dengan enkripsi <strong className="text-foreground">{algorithm}</strong>. Siapa pun yang mencoba membuka berkas ini wajib memasukkan kata sandi yang telah Anda tetapkan.
                        </p>
                    </div>

                    {/* File Info Box */}
                    <div className="max-w-md mx-auto p-4 rounded-2xl bg-surface/60 border border-border/60 flex items-center justify-between text-left">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div className="truncate">
                                <p className="text-sm font-bold text-foreground truncate">{resultFileName}</p>
                                <p className="text-xs text-foreground/60">{formatBytes(resultSize)} • {pageCount} Halaman</p>
                            </div>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                            Terkunci
                        </span>
                    </div>

                    {/* Important Security Notice */}
                    <div className="max-w-lg mx-auto p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300/90 text-xs text-left flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                        <div>
                            <strong className="font-semibold block mb-0.5 text-amber-300">Peringatan Keamanan Penting:</strong>
                            Harap catat dan simpan kata sandi Anda dengan aman. Karena DataScry memproses dokumen 100% di browser Anda tanpa server atau basis data, <strong>kata sandi yang hilang tidak dapat dipulihkan</strong> oleh siapa pun.
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <a
                            href={resultBlobUrl}
                            download={resultFileName}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-linear-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95"
                        >
                            <Download className="w-5 h-5" />
                            Unduh PDF Terkunci
                        </a>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-surface hover:bg-surface/80 border border-border/80 text-foreground font-semibold transition-colors"
                        >
                            <RotateCcw className="w-4 h-4 text-foreground/70" />
                            Kunci Berkas Lain
                        </button>
                    </div>
                </div>
            ) : (
                /* Step 2: Configure Password & Permissions */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: File Details & Preview */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="glass-panel p-6 rounded-3xl border border-border/80 shadow-xl space-y-5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-amber-500" />
                                    Dokumen Terpilih
                                </h3>
                                <button
                                    onClick={handleReset}
                                    className="text-xs text-foreground/50 hover:text-rose-400 transition-colors"
                                >
                                    Ganti Berkas
                                </button>
                            </div>

                            {/* Thumbnail Clickable for Lightbox Zoom */}
                            <div 
                                onClick={() => {
                                    if (!thumbnailUrl) return;
                                    setLightboxItem({
                                        url: thumbnailUrl,
                                        title: `Halaman Depan: ${file?.name || "Dokumen PDF"}`,
                                        pageNumber: 1,
                                        totalPages: pageCount,
                                        aspectRatio: "A4 Portrait"
                                    });
                                }}
                                className="relative aspect-3/4 rounded-2xl overflow-hidden bg-black/40 border border-border/60 flex items-center justify-center cursor-pointer group/thumb shadow-inner"
                                title="Klik untuk memperbesar pratinjau halaman"
                            >
                                {isAnalyzing ? (
                                    <div className="flex flex-col items-center gap-2 text-foreground/50">
                                        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                                        <span className="text-xs">Memuat dokumen...</span>
                                    </div>
                                ) : thumbnailUrl ? (
                                    <img
                                        src={thumbnailUrl}
                                        alt="Pratinjau Halaman Depan"
                                        className="w-full h-full object-contain rounded-none pointer-events-none"
                                    />
                                ) : (
                                    <FileText className="w-12 h-12 text-foreground/30" />
                                )}

                                <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-medium text-white">
                                    {pageCount} Halaman
                                </div>

                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="p-2 rounded-full bg-amber-500 text-white shadow-lg transform scale-90 group-hover/thumb:scale-100 transition-transform">
                                        <ZoomIn className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            {/* File Meta */}
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-foreground truncate" title={file.name}>
                                    {file.name}
                                </p>
                                <p className="text-xs text-foreground/60">
                                    Ukuran: {formatBytes(file.size)}
                                </p>
                            </div>
                        </div>

                        {/* Security Guarantee Box */}
                        <div className="p-5 rounded-3xl bg-surface/50 border border-border/60 text-xs text-foreground/70 space-y-3">
                            <div className="flex items-center gap-2 font-bold text-foreground">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                Jaminan Privasi Nol Unggah
                            </div>
                            <p className="leading-relaxed">
                                Seluruh proses enkripsi dan proteksi dijalankan langsung di memori perangkat Anda menggunakan mesin kriptografi peramban (Web Crypto API). Kata sandi dan berkas PDF Anda tidak pernah disentuh atau dikirim ke server mana pun.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Password Form & Permissions */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-border/80 shadow-xl space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-foreground flex items-center gap-2.5">
                                    <Key className="w-5 h-5 text-amber-500" />
                                    Atur Kata Sandi PDF
                                </h3>
                                <p className="text-sm text-foreground/60 mt-1">
                                    Tetapkan kata sandi yang dibutuhkan pembaca untuk membuka berkas ini.
                                </p>
                            </div>

                            {/* Main Password Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground/80 flex items-center justify-between">
                                    <span>Kata Sandi Buka Dokumen (User Password) *</span>
                                    {password && (
                                        <span className={`text-[11px] font-bold ${strengthLabel.color}`}>
                                            Kekuatan: {strengthLabel.text}
                                        </span>
                                    )}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Masukkan kata sandi rahasia..."
                                        className="w-full px-4 py-3 pr-11 rounded-2xl bg-surface/80 border border-border/80 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-foreground text-sm transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground p-1 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Password Strength Bar */}
                                {password && (
                                    <div className="space-y-1.5 pt-1">
                                        <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${strengthLabel.bg} transition-all duration-300`}
                                                style={{ width: `${strengthLabel.percent}%` }}
                                            />
                                        </div>
                                        <p className="text-[11px] text-foreground/50">
                                            Saran: Gunakan minimal 8 karakter dengan kombinasi huruf besar, kecil, angka, dan simbol.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground/80">
                                    Konfirmasi Kata Sandi *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Ketik ulang kata sandi di atas..."
                                        className={`w-full px-4 py-3 pr-11 rounded-2xl bg-surface/80 border text-foreground text-sm transition-all focus:outline-none ${
                                            confirmPassword && confirmPassword !== password
                                                ? "border-rose-500/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                                                : "border-border/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground p-1 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {confirmPassword && confirmPassword !== password && (
                                    <p className="text-[11px] text-rose-400">
                                        Kata sandi konfirmasi tidak cocok dengan kata sandi di atas.
                                    </p>
                                )}
                            </div>

                            {/* Encryption Algorithm Selection */}
                            <div className="space-y-2 pt-2 border-t border-border/40">
                                <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                                    <span>Algoritma Enkripsi Standar</span>
                                    <span title="AES-256 adalah standar modern paling aman. RC4 digunakan untuk kompatibilitas perangkat jadul.">
                                        <HelpCircle className="w-3.5 h-3.5 text-foreground/40 cursor-help" />
                                    </span>
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setAlgorithm("AES-256")}
                                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                                            algorithm === "AES-256"
                                                ? "bg-amber-500/10 border-amber-500/40 shadow-md text-foreground"
                                                : "bg-surface/50 border-border/60 hover:bg-surface text-foreground/70"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-sm">AES-256 (Modern)</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                                                Rekomendasi
                                            </span>
                                        </div>
                                        <p className="text-xs text-foreground/60 leading-relaxed">
                                            Standar keamanan tertinggi (PDF 2.0). Kompatibel dengan semua pembaca PDF modern.
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setAlgorithm("RC4")}
                                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                                            algorithm === "RC4"
                                                ? "bg-amber-500/10 border-amber-500/40 shadow-md text-foreground"
                                                : "bg-surface/50 border-border/60 hover:bg-surface text-foreground/70"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-sm">RC4 (128-bit)</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-border/80 text-foreground/50 font-medium">
                                                Legacy
                                            </span>
                                        </div>
                                        <p className="text-xs text-foreground/60 leading-relaxed">
                                            Kompatibilitas maksimum dengan perangkat keras lama atau aplikasi lawas.
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Advanced Permissions Accordion */}
                            <div className="pt-2 border-t border-border/40 space-y-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="w-full flex items-center justify-between py-2 text-xs font-bold text-foreground/80 hover:text-foreground transition-colors group"
                                >
                                    <span className="flex items-center gap-2">
                                        <Sliders className="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform" />
                                        Pengaturan Izin & Kata Sandi Pemilik (Opsional)
                                    </span>
                                    <span className="text-[11px] text-amber-400 font-medium">
                                        {showAdvanced ? "Sembunyikan ▲" : "Tampilkan Opsi ▼"}
                                    </span>
                                </button>

                                {showAdvanced && (
                                    <div className="p-4 sm:p-5 rounded-2xl bg-surface/60 border border-border/60 space-y-4 animate-fade-in">
                                        {/* Owner Password */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground/80 flex items-center justify-between">
                                                <span>Kata Sandi Pemilik / Administrator (Owner Password)</span>
                                                <span className="text-[10px] text-foreground/40 font-normal">Opsional</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showOwnerPassword ? "text" : "password"}
                                                    value={ownerPassword}
                                                    onChange={(e) => setOwnerPassword(e.target.value)}
                                                    placeholder="Kata sandi berbeda untuk mengubah izin..."
                                                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-surface border border-border/80 focus:border-amber-500 focus:outline-none text-foreground text-xs"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-1 transition-colors"
                                                >
                                                    {showOwnerPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-foreground/50">
                                                Kata sandi ini digunakan untuk mengubah hak izin di masa mendatang tanpa menghapus enkripsi. Harus berbeda dengan kata sandi buka.
                                            </p>
                                        </div>

                                        {/* Granular Permissions Checkboxes */}
                                        <div className="space-y-2 pt-2">
                                            <span className="text-xs font-semibold text-foreground/80 block">
                                                Hak Izin Pengguna:
                                            </span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                {/* Allow Printing */}
                                                <button
                                                    type="button"
                                                    onClick={() => setAllowPrinting(!allowPrinting)}
                                                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface/50 border border-border/60 hover:bg-surface transition-colors text-left"
                                                >
                                                    {allowPrinting ? (
                                                        <CheckSquare className="w-4 h-4 text-amber-500 shrink-0" />
                                                    ) : (
                                                        <Square className="w-4 h-4 text-foreground/40 shrink-0" />
                                                    )}
                                                    <div className="text-xs">
                                                        <span className="font-semibold text-foreground block">Izinkan Cetak</span>
                                                        <span className="text-[10px] text-foreground/50">Mencetak dokumen ke printer</span>
                                                    </div>
                                                </button>

                                                {/* Allow Copying */}
                                                <button
                                                    type="button"
                                                    onClick={() => setAllowCopying(!allowCopying)}
                                                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface/50 border border-border/60 hover:bg-surface transition-colors text-left"
                                                >
                                                    {allowCopying ? (
                                                        <CheckSquare className="w-4 h-4 text-amber-500 shrink-0" />
                                                    ) : (
                                                        <Square className="w-4 h-4 text-foreground/40 shrink-0" />
                                                    )}
                                                    <div className="text-xs">
                                                        <span className="font-semibold text-foreground block">Izinkan Salin Teks</span>
                                                        <span className="text-[10px] text-foreground/50">Copy teks atau grafik</span>
                                                    </div>
                                                </button>

                                                {/* Allow Modifying */}
                                                <button
                                                    type="button"
                                                    onClick={() => setAllowModifying(!allowModifying)}
                                                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface/50 border border-border/60 hover:bg-surface transition-colors text-left"
                                                >
                                                    {allowModifying ? (
                                                        <CheckSquare className="w-4 h-4 text-amber-500 shrink-0" />
                                                    ) : (
                                                        <Square className="w-4 h-4 text-foreground/40 shrink-0" />
                                                    )}
                                                    <div className="text-xs">
                                                        <span className="font-semibold text-foreground block">Izinkan Modifikasi</span>
                                                        <span className="text-[10px] text-foreground/50">Mengubah atau mengedit isi</span>
                                                    </div>
                                                </button>

                                                {/* Allow Form Filling */}
                                                <button
                                                    type="button"
                                                    onClick={() => setAllowFillingForms(!allowFillingForms)}
                                                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface/50 border border-border/60 hover:bg-surface transition-colors text-left"
                                                >
                                                    {allowFillingForms ? (
                                                        <CheckSquare className="w-4 h-4 text-amber-500 shrink-0" />
                                                    ) : (
                                                        <Square className="w-4 h-4 text-foreground/40 shrink-0" />
                                                    )}
                                                    <div className="text-xs">
                                                        <span className="font-semibold text-foreground block">Izinkan Isi Formulir</span>
                                                        <span className="text-[10px] text-foreground/50">Mengisi form interaktif</span>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    disabled={!password || password !== confirmPassword || isEncrypting}
                                    onClick={handleEncryptPdf}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-linear-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    {isEncrypting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Mengenksipsi Dokumen PDF...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-5 h-5" />
                                            <span>Kunci & Enkripsi PDF Sekarang</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Lightbox Reusable untuk Zoom Pratinjau Dokumen */}
            <MediaLightboxModal
                isOpen={lightboxItem !== null}
                onClose={() => setLightboxItem(null)}
                item={lightboxItem}
                accentColor="amber"
            />
        </div>
    );
}
