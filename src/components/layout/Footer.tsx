import Link from "next/link";
import { Github, ShieldCheck, Zap } from "lucide-react";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full mt-auto border-t border-border/50 bg-black/20 backdrop-blur-md relative z-10">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
                    {/* Brand Info */}
                    <div className="md:col-span-2 space-y-4">
                        <Link href="/" className="inline-flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-focus flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                                <ShieldCheck className="text-primary-content" size={18} />
                            </div>
                            <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                                PrivaKit
                            </span>
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
                            <h4 className="text-sm font-bold tracking-wider text-foreground">TOOLS</h4>
                            <ul className="space-y-3 text-sm text-foreground/60">
                                <li>
                                    <Link href="/tools/compress" className="hover:text-primary transition-colors">
                                        Kompresi File Lokal
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/tools/scrub-exif" className="hover:text-primary transition-colors">
                                        Pembersih Jejak Metadata
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/tools/jpg-to-pdf" className="hover:text-primary transition-colors">
                                        Ubah JPG ke PDF
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/tools/pdf-to-jpg" className="hover:text-primary transition-colors">
                                        Ekstrak Halaman (PDF to JPG)
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Socials & Legal */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold tracking-wider text-foreground">OPEN SOURCE</h4>
                            <p className="text-sm text-foreground/60 leading-relaxed pr-4">
                                Berkontribusi pada privasi pengguna.
                            </p>
                            <a
                                href="https://github.com/NXRts/PrivaKit"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 mt-2 text-sm font-medium bg-surface/50 border border-border/50 hover:bg-surface/80 rounded-xl transition-all"
                            >
                                <Github size={16} />
                                <span className="hidden sm:inline">GitHub Repo</span>
                                <span className="sm:hidden">GitHub</span>
                            </a>
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
