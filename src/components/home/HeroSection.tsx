import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function HeroSection() {
    return (
        <section className="relative pt-20 pb-32 flex flex-col items-center justify-center min-h-[70vh]">
            {/* Background Effects */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-primary/30 rounded-full blur-[120px] opacity-50 -z-10"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] opacity-50 -z-10"></div>

            <div className="container mx-auto px-4 max-w-5xl text-center z-10 space-y-8">
                {/* Top Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border/50 text-sm font-medium text-foreground/80 mb-4 animate-fade-in shadow-xl mx-auto backdrop-blur-md">
                    <ShieldCheck className="text-emerald-500 w-4 h-4" />
                    <span>Lokal 100%. Tidak ada batasan ukuran file.</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight tight-leading text-balance">
                    Kelola File Anda secara <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-primary-focus leading-tight pb-2 inline-block">
                        Privat dan Instan
                    </span>
                </h1>

                {/* Subtitle */}
                <p className="text-lg sm:text-xl md:text-2xl text-foreground/70 max-w-3xl mx-auto px-4 text-balance leading-relaxed">
                    Setiap detik dokumen Anda diproses <strong className="font-bold text-foreground">sepenuhnya di peramban Anda</strong>. Kompres, ubah, gabung PDF, hingga hapus jejak foto tanpa mengunggahnya ke server mana pun. Keamanan mutlak gratis.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                    <Link
                        href="/tools/merge-pdf"
                        className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white bg-primary hover:bg-primary-focus rounded-2xl transition-all shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1"
                    >
                        Pilih PDF Anda
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                        href="#tools"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-foreground bg-surface/80 hover:bg-surface border border-border/50 rounded-2xl transition-all hover:border-primary/30 backdrop-blur-md"
                    >
                        <Zap className="w-5 h-5 text-amber-500" />
                        Jelajahi Alat Kami
                    </Link>
                </div>
            </div>
        </section>
    );
}
