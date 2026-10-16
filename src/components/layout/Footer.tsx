import Link from "next/link";
import {
    Github,
    Globe,
    Instagram,
    ShieldCheck,
    Zap,
    Heart,
    Coffee,
    Lock,
    Sparkles
} from "lucide-react";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full mt-auto border-t border-border/60 bg-surface/30 backdrop-blur-xl relative z-10">
            <div className="container mx-auto px-4 py-8 md:py-14">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
                    {/* Kolom 1: Brand & Jaminan Keamanan */}
                    <div className="space-y-4">
                        <Link href="/" className="inline-flex items-center gap-2.5 group">
                            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-primary to-primary-focus flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform shrink-0">
                                <ShieldCheck className="text-primary-content" size={18} />
                            </div>
                            <span className="font-extrabold text-lg md:text-xl tracking-tight text-foreground">DataScry</span>
                        </Link>
                        
                        <p className="text-foreground/70 text-xs md:text-sm leading-relaxed">
                            Platform produktivitas dokumen & gambar 100% lokal di peramban Anda. Bebas server, zero data upload, dan privasi penuh tanpa batas pakai.
                        </p>

                        {/* Cluster Trust Badges */}
                        <div className="pt-1 flex flex-col gap-2">
                            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium w-fit">
                                <Lock size={13} className="shrink-0 text-emerald-400" />
                                <span>Zero Server Upload</span>
                            </div>
                            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium w-fit">
                                <Zap size={13} className="shrink-0 text-primary" />
                                <span>Web Worker & WASM</span>
                            </div>
                            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-surface/80 border border-border/70 text-foreground/70 text-xs font-medium w-fit">
                                <Sparkles size={13} className="shrink-0 text-amber-400" />
                                <span>100% Bebas Iklan & Pelacak</span>
                            </div>
                        </div>
                    </div>

                    {/* Kolom 2: Dokumen & PDF Populer */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold tracking-wider text-foreground uppercase flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <span>DOKUMEN & PDF</span>
                        </h4>
                        <ul className="space-y-2 text-xs md:text-sm text-foreground/70">
                            <li>
                                <Link href="/tools/merge-pdf" className="hover:text-purple-400 transition-colors block py-0.5 truncate">
                                    Gabungkan Berkas PDF
                                </Link>
                            </li>
                            <li>
                                <Link href="/tools/compress" className="hover:text-blue-400 transition-colors block py-0.5 truncate">
                                    Kompres PDF & Dokumen
                                </Link>
                            </li>
                            <li>
                                <Link href="/tools/jpg-to-pdf" className="hover:text-amber-400 transition-colors block py-0.5 truncate">
                                    Ubah Foto JPG ke PDF
                                </Link>
                            </li>
                            <li>
                                <Link href="/tools/watermark-pdf" className="hover:text-red-400 transition-colors block py-0.5 truncate">
                                    Cap Air Watermark PDF
                                </Link>
                            </li>
                            <li>
                                <Link href="/tools/sign-pdf" className="hover:text-indigo-400 transition-colors block py-0.5 truncate">
                                    Tanda Tangan Dokumen PDF
                                </Link>
                            </li>
                            <li>
                                <Link href="/tools/redact-pdf" className="hover:text-rose-400 transition-colors block py-0.5 truncate">
                                    Sensor Rahasia PDF (Redact)
                                </Link>
                            </li>
                            <li>
                                <Link href="/tools/split-pdf" className="hover:text-teal-400 transition-colors block py-0.5 truncate">
                                    Pisahkan & Ekstrak PDF
                                </Link>
                            </li>
                            <li className="pt-1.5">
                                <Link
                                    href="/#tools"
                                    className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 transition-colors group"
                                >
                                    <span>Lihat Semua Alat Dokumen</span>
                                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Kolom 3: Foto, Gambar & Arsip */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold tracking-wider text-foreground uppercase flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>FOTO & ARSIP</span>
                        </h4>
                        <ul className="space-y-2 text-xs md:text-sm text-foreground/70">
                            <li>
                                <Link href="/tools/upscale-image" className="hover:text-purple-400 transition-colors inline-flex items-center gap-1.5 py-0.5 truncate">
                                    <span>Tingkatkan Resolusi Foto</span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-purple-500/15 text-purple-400 font-bold border border-purple-500/25">AI HD</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/tools/watermark-image" className="hover:text-rose-400 transition-colors inline-flex items-center gap-1.5 py-0.5 truncate">
                                    <span>Cap Air Gambar / Foto</span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-rose-500/15 text-rose-400 font-bold border border-rose-500/25">Baru</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/tools/remove-background" className="hover:text-emerald-400 transition-colors block py-0.5 truncate">
                                    Hapus Latar Belakang AI
                                </Link>
                            </li>
                            <li>
                                <Link href="/tools/blur-face" className="hover:text-rose-400 transition-colors block py-0.5 truncate">
                                    Sensor & Blur Wajah Foto
                                </Link>
                            </li>
                            <li>
                                <Link href="/tools/convert-image" className="hover:text-amber-400 transition-colors block py-0.5 truncate">
                                    Konverter Gambar (WebP, PNG)
                                </Link>
                            </li>
                            <li>
                                <Link href="/tools/crop-image" className="hover:text-orange-400 transition-colors block py-0.5 truncate">
                                    Potong & Pangkas Gambar
                                </Link>
                            </li>
                            <li>
                                <Link href="/tools/unzip" className="hover:text-fuchsia-400 transition-colors block py-0.5 truncate">
                                    Ekstrak & Intip Isi ZIP
                                </Link>
                            </li>
                            <li>
                                <Link href="/tools/archive-zip" className="hover:text-violet-400 transition-colors block py-0.5 truncate">
                                    Kompres Berkas ke Arsip ZIP
                                </Link>
                            </li>
                            <li className="pt-1.5">
                                <Link
                                    href="/#tools"
                                    className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 transition-colors group"
                                >
                                    <span>Lihat Semua Alat Gambar</span>
                                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Kolom 4: Dukung Pengembang & Terhubung */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold tracking-wider text-foreground uppercase flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>DUKUNG PENGEMBANG</span>
                        </h4>

                        {/* Kartu Dukungan Terintegrasi (Tanpa Redundansi) */}
                        <div className="p-3.5 rounded-2xl bg-surface/60 border border-border/80 space-y-3 shadow-sm hover:border-border transition-colors">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                                    <Heart size={14} className="fill-rose-500 text-rose-500 animate-pulse" />
                                </div>
                                <span className="text-xs font-bold text-foreground">Apresiasi & Beli Kopi</span>
                            </div>
                            <p className="text-xs text-foreground/70 leading-relaxed">
                                DataScry sepenuhnya gratis tanpa server & tanpa iklan. Dukung kami agar terus aktif menghadirkan alat privasi baru!
                            </p>
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <a
                                    href="https://saweria.co/yusufarrofi"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 dark:text-amber-400 border border-amber-500/30 hover:border-amber-500/60 transition-all hover:scale-105 active:scale-95 shadow-xs group"
                                    title="Dukung lewat Saweria (Gopay, OVO, Dana, QRIS)"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover:animate-ping shrink-0" />
                                    <span>Saweria</span>
                                </a>
                                <a
                                    href="https://ko-fi.com/yusufarrofi/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-500 dark:text-sky-400 border border-sky-500/30 hover:border-sky-500/60 transition-all hover:scale-105 active:scale-95 shadow-xs group"
                                    title="Dukung lewat Ko-fi (Card, PayPal)"
                                >
                                    <Coffee size={13} className="text-sky-400 group-hover:scale-110 transition-transform shrink-0" />
                                    <span>Ko-fi</span>
                                </a>
                            </div>
                        </div>

                        {/* Profil Pengembang & Media Sosial Berseragam */}
                        <div className="space-y-2 pt-1">
                            <p className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wider">
                                Terhubung dengan Pengembang
                            </p>
                            <div className="flex items-center gap-2">
                                <a
                                    href="https://github.com/NXRts"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 rounded-xl bg-surface/70 hover:bg-surface border border-border/70 hover:border-primary/50 text-foreground/70 hover:text-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                    title="GitHub @NXRts"
                                >
                                    <Github size={16} />
                                </a>
                                <a
                                    href="https://www.instagram.com/my_arrofi/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 rounded-xl bg-surface/70 hover:bg-surface border border-border/70 hover:border-pink-500/50 text-foreground/70 hover:text-pink-400 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                    title="Instagram @my_arrofi"
                                >
                                    <Instagram size={16} />
                                </a>
                                <a
                                    href="https://yusufarrofi.my.id/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 rounded-xl bg-surface/70 hover:bg-surface border border-border/70 hover:border-emerald-500/50 text-foreground/70 hover:text-emerald-400 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                    title="Website Pribadi (yusufarrofi.my.id)"
                                >
                                    <Globe size={16} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar: Hak Cipta & Stack Teknologi */}
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border/40 mt-8 md:mt-14 pt-4 md:pt-6 text-xs text-foreground/50 text-center sm:text-left gap-2 sm:gap-0">
                    <p>© {currentYear} DataScry oleh <span className="text-foreground/70 font-medium">NXRts</span>. Hak Cipta Dilindungi.</p>
                    <div className="flex items-center gap-3">
                        <span>100% Client-Side Engine</span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span>Ditenagai WebAssembly & Next.js</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
