import Link from "next/link";
import { Github, Globe, Instagram, ShieldCheck, Zap } from "lucide-react";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full mt-auto border-t border-border/50 bg-black/20 backdrop-blur-md relative z-10">
            <div className="container mx-auto px-4 py-6 md:py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
                    {/* Brand Info */}
                    <div className="md:col-span-2 space-y-2.5 md:space-y-4">
                        <Link href="/" className="inline-flex items-center gap-2 group">
                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-linear-to-br from-primary to-primary-focus flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                                <ShieldCheck className="text-primary-content" size={16} />
                            </div>
                            <span className="font-bold text-base md:text-lg tracking-tight">DataScry</span>
                        </Link>
                        <p className="text-foreground/60 text-xs md:text-sm max-w-sm leading-relaxed">
                            Platform manajemen dokumen dan foto 100% lokal di peramban Anda. Tanpa server, tanpa kirim data privasi, dan tanpa batas pakai.
                        </p>
                        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-emerald-500/80 bg-emerald-500/10 px-3 py-1.5 rounded-full w-fit">
                            <Zap size={14} className="fill-emerald-500" />
                            Web Worker Powered
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:gap-8 md:col-span-2">
                        {/* Quick Links */}
                        <div className="space-y-2 md:space-y-4">
                            <h4 className="text-[11px] md:text-xs font-bold tracking-wider text-foreground uppercase">ALAT POPULER</h4>
                            <ul className="space-y-1.5 md:space-y-2.5 text-xs md:text-sm text-foreground/70">
                                <li>
                                    <Link href="/tools/convert-image" className="hover:text-amber-400 transition-colors block py-0.5 truncate">
                                        Konverter Gambar
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/tools/unzip" className="hover:text-fuchsia-400 transition-colors block py-0.5 truncate">
                                        Ekstrak & Intip ZIP
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/tools/blur-face" className="hover:text-rose-400 transition-colors block py-0.5 truncate">
                                        Sensor & Blur Foto
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/tools/remove-background" className="hover:text-emerald-400 transition-colors block py-0.5 truncate">
                                        Hapus Latar Belakang
                                    </Link>
                                </li>
                                <li className="hidden md:block">
                                    <Link href="/tools/jpg-to-pdf" className="hover:text-amber-400 transition-colors block py-0.5 truncate">
                                        Ubah JPG ke PDF
                                    </Link>
                                </li>
                                <li className="hidden md:block">
                                    <Link href="/tools/merge-pdf" className="hover:text-purple-400 transition-colors block py-0.5 truncate">
                                        Gabungkan PDF
                                    </Link>
                                </li>
                                <li className="hidden md:block">
                                    <Link href="/tools/compress" className="hover:text-blue-400 transition-colors block py-0.5 truncate">
                                        Kompres PDF & Foto
                                    </Link>
                                </li>
                                <li className="hidden md:block">
                                    <Link href="/tools/archive-zip" className="hover:text-violet-400 transition-colors block py-0.5 truncate">
                                        Kompres Berkas ke ZIP
                                    </Link>
                                </li>
                                <li className="pt-1">
                                    <Link
                                        href="/#tools"
                                        className="text-[11px] md:text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 transition-colors group"
                                    >
                                        <span>Lihat Semua Alat</span>
                                        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Socials & Connect */}
                        <div className="space-y-2 md:space-y-4">
                            <h4 className="text-[11px] md:text-xs font-bold tracking-wider text-foreground uppercase">TERHUBUNG</h4>
                            <p className="text-xs md:text-sm text-foreground/60 leading-relaxed pr-2 hidden sm:block">
                                Berkontribusi pada privasi pengguna & ikuti kabar terbaru.
                            </p>
                            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 pt-0.5">
                                <a
                                    href="https://github.com/NXRts"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 text-xs md:text-sm font-medium bg-surface/50 border border-border/50 hover:bg-surface/80 hover:border-primary/40 rounded-xl transition-all"
                                >
                                    <Github size={14} className="shrink-0" />
                                    <span>GitHub</span>
                                </a>
                                <a
                                    href="https://www.instagram.com/my_arrofi/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 text-xs md:text-sm font-medium bg-surface/50 border border-border/50 hover:bg-surface/80 hover:border-pink-500/40 rounded-xl transition-all group"
                                >
                                    <Instagram size={14} className="text-pink-400 group-hover:scale-110 transition-transform shrink-0" />
                                    <span>Instagram</span>
                                </a>
                                <a
                                    href="https://yusufarrofi.my.id/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 text-xs md:text-sm font-medium bg-surface/50 border border-border/50 hover:bg-surface/80 hover:border-emerald-500/40 rounded-xl transition-all group"
                                >
                                    <Globe size={14} className="text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                                    <span>Website</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between border-t border-border/30 mt-6 md:mt-12 pt-4 md:pt-8 text-[11px] md:text-xs text-foreground/50 text-center md:text-left gap-2 md:gap-0">
                    <p>© {currentYear} NXRts. Hak Cipta Dilindungi.</p>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            Dibangun dengan Next.js & Tailwind CSS
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
