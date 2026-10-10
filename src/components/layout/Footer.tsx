import Link from "next/link";
import { Github, Globe, Instagram, ShieldCheck, Zap } from "lucide-react";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full mt-auto border-t border-border/50 bg-black/20 backdrop-blur-md relative z-10">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
                    {/* Brand Info */}
                    <div className="md:col-span-2 space-y-4">
                        <Link href="/" className="inline-flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-primary to-primary-focus flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                                <ShieldCheck className="text-primary-content" size={18} />
                            </div>
                            DataScry
                        </Link>
                        <p className="text-foreground/60 text-sm max-w-sm mt-4 leading-relaxed">
                            Platform lengkap manajemen dokumen dan foto yang memproses segalanya 100% secara lokal. Tanpa server, tanpa unggahan privasi, tanpa batas pakai.
                        </p>
                        <div className="flex items-center gap-2 mt-4 text-xs font-medium text-emerald-500/80 bg-emerald-500/10 px-3 py-1.5 rounded-full w-fit">
                            <Zap size={14} className="fill-emerald-500" />
                            Web Worker Powered
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 md:col-span-2">
                        {/* Quick Links */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold tracking-wider text-foreground uppercase">ALAT POPULER</h4>
                            <ul className="space-y-2.5 text-sm text-foreground/70">
                                <li>
                                    <Link href="/tools/convert-image" className="hover:text-amber-400 transition-colors block py-0.5">
                                        Konverter Format Gambar
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/tools/unzip" className="hover:text-fuchsia-400 transition-colors block py-0.5">
                                        Ekstrak & Intip ZIP
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/tools/blur-face" className="hover:text-rose-400 transition-colors block py-0.5">
                                        Sensor & Blur Foto
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/tools/remove-background" className="hover:text-emerald-400 transition-colors block py-0.5">
                                        Hapus Latar Belakang (AI)
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/tools/jpg-to-pdf" className="hover:text-amber-400 transition-colors block py-0.5">
                                        Ubah JPG ke PDF
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/tools/merge-pdf" className="hover:text-purple-400 transition-colors block py-0.5">
                                        Gabungkan PDF
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/tools/compress" className="hover:text-blue-400 transition-colors block py-0.5">
                                        Kompres PDF & Foto
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/tools/archive-zip" className="hover:text-violet-400 transition-colors block py-0.5">
                                        Kompres Berkas ke ZIP
                                    </Link>
                                </li>
                                <li className="pt-1.5">
                                    <Link
                                        href="/#tools"
                                        className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 transition-colors group"
                                    >
                                        <span>Lihat Semua 23 Alat</span>
                                        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Socials & Legal */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold tracking-wider text-foreground">TERHUBUNG & KODE</h4>
                            <p className="text-sm text-foreground/60 leading-relaxed pr-4">
                                Berkontribusi pada privasi pengguna & ikuti kabar terbaru.
                            </p>
                            <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                <a
                                    href="https://github.com/NXRts"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-surface/50 border border-border/50 hover:bg-surface/80 hover:border-primary/40 rounded-xl transition-all"
                                >
                                    <Github size={16} />
                                    <span>GitHub</span>
                                </a>
                                <a
                                    href="https://www.instagram.com/my_arrofi/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-surface/50 border border-border/50 hover:bg-surface/80 hover:border-pink-500/40 rounded-xl transition-all group"
                                >
                                    <Instagram size={16} className="text-pink-400 group-hover:scale-110 transition-transform" />
                                    <span>Instagram</span>
                                </a>
                                <a
                                    href="https://yusufarrofi.my.id/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-surface/50 border border-border/50 hover:bg-surface/80 hover:border-emerald-500/40 rounded-xl transition-all group"
                                >
                                    <Globe size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                                    <span>Website</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between border-t border-border/30 mt-12 pt-8 text-xs text-foreground/50 text-center md:text-left gap-4 md:gap-0">
                    <p>© {currentYear} NXRts. Hak Cipta Dilindungi.</p>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            Dibangun dengan Next.js 15 & Tailwind CSS
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
