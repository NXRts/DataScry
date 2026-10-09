import Link from "next/link";
import {
    ArrowRight,
    ArrowDown,
    ShieldCheck,
    Zap,
    Files,
    FileType,
    Minimize2,
    ShieldAlert,
    Cpu,
    Sparkles
} from "lucide-react";

export default function HeroSection() {
    const heroColorThemes: Record<
        string,
        {
            borderHover: string;
            textHover: string;
            arrowHover: string;
            iconBoxHover: string;
        }
    > = {
        purple: {
            borderHover: "hover:border-purple-500/50",
            textHover: "group-hover:text-purple-400",
            arrowHover: "group-hover:text-purple-400",
            iconBoxHover: "group-hover:border-purple-500/40 group-hover:bg-purple-500/10",
        },
        blue: {
            borderHover: "hover:border-blue-500/50",
            textHover: "group-hover:text-blue-400",
            arrowHover: "group-hover:text-blue-400",
            iconBoxHover: "group-hover:border-blue-500/40 group-hover:bg-blue-500/10",
        },
        cyan: {
            borderHover: "hover:border-cyan-500/50",
            textHover: "group-hover:text-cyan-400",
            arrowHover: "group-hover:text-cyan-400",
            iconBoxHover: "group-hover:border-cyan-500/40 group-hover:bg-cyan-500/10",
        },
        emerald: {
            borderHover: "hover:border-emerald-500/50",
            textHover: "group-hover:text-emerald-400",
            arrowHover: "group-hover:text-emerald-400",
            iconBoxHover: "group-hover:border-emerald-500/40 group-hover:bg-emerald-500/10",
        },
    };

    const quickFeatures = [
        {
            title: "Gabungkan PDF & Word",
            desc: "Kombinasikan beberapa dokumen tanpa batasan ukuran.",
            icon: <Files className="w-5 h-5 text-purple-400" />,
            href: "/tools/merge-pdf",
            tag: "Populer",
            color: "purple"
        },
        {
            title: "Konversi PDF ke Word",
            desc: "Ekstrak teks dan ubah format dokumen secara instan.",
            icon: <FileType className="w-5 h-5 text-blue-400" />,
            href: "/tools/pdf-to-word",
            tag: "Instan",
            color: "blue"
        },
        {
            title: "Kompres PDF & Gambar",
            desc: "Pangkas ukuran file besar tanpa kehilangan kualitas.",
            icon: <Minimize2 className="w-5 h-5 text-cyan-400" />,
            href: "/tools/compress",
            tag: "Hemat Ruang",
            color: "cyan"
        },
        {
            title: "Hapus Metadata EXIF",
            desc: "Bersihkan lokasi GPS & data privasi sebelum dibagikan.",
            icon: <ShieldAlert className="w-5 h-5 text-emerald-400" />,
            href: "/tools/scrub-exif",
            tag: "Privasi",
            color: "emerald"
        }
    ];

    return (
        <section className="relative min-h-[calc(100dvh-4rem)] flex flex-col justify-between pt-8 pb-6 md:pt-12 md:pb-8 overflow-hidden">
            <div className="container mx-auto px-4 lg:px-8 max-w-7xl my-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                    {/* Left Column: Headline, Description, and Primary Actions */}
                    <div className="lg:col-span-7 space-y-6 text-left">
                        {/* Top Badge */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-border text-xs sm:text-sm font-medium text-foreground/80 shadow-md">
                            <ShieldCheck className="text-emerald-500 shrink-0 w-4 h-4" />
                            <span>100% Client-Side • Tanpa Batas Ukuran File</span>
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-balance">
                            Kelola File Anda secara{" "}
                            <span className="text-primary">
                                Privat dan Instan
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-base sm:text-lg md:text-xl text-foreground/70 max-w-2xl leading-relaxed">
                            Setiap detik dokumen Anda diproses <strong className="font-semibold text-foreground">sepenuhnya di peramban Anda</strong>. Kompres, ubah, gabung PDF/Word, hingga hapus jejak foto tanpa mengunggahnya ke server mana pun. Keamanan mutlak gratis.
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                            <Link
                                href="/tools/merge-pdf"
                                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-bold text-white bg-primary hover:bg-primary-focus rounded-2xl transition-all hover:-translate-y-0.5 active:scale-95"
                            >
                                Mulai Gabung PDF
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="#tools"
                                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-bold text-foreground bg-surface hover:bg-surface/80 border border-border rounded-2xl transition-all hover:border-primary/40 active:scale-95"
                            >
                                <Zap className="w-5 h-5 text-amber-500" />
                                Jelajahi Semua Alat
                            </Link>
                        </div>

                        {/* Key Metrics / Trust Signals */}
                        <div className="pt-6 border-t border-border/60 grid grid-cols-3 gap-4 max-w-lg">
                            <div>
                                <p className="text-xs font-medium text-foreground/50">Pemrosesan</p>
                                <p className="text-sm sm:text-base font-bold text-foreground">100% Lokal</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-foreground/50">Keamanan</p>
                                <p className="text-sm sm:text-base font-bold text-emerald-400">Zero Cloud Upload</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-foreground/50">Akses</p>
                                <p className="text-sm sm:text-base font-bold text-foreground">Gratis Tanpa Kuota</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Interactive Quick-Access Showcase Panel */}
                    <div className="lg:col-span-5">
                        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-border/80 shadow-2xl space-y-5 relative">
                            {/* Panel Header */}
                            <div className="flex items-center justify-between border-b border-border/60 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                        <Cpu className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm sm:text-base text-foreground">Akses Cepat Alat Unggulan</h3>
                                        <p className="text-xs text-foreground/50">Pilih alat langsung untuk memulai</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span>Aktif</span>
                                </div>
                            </div>

                            {/* Quick Tool Links */}
                            <div className="space-y-3">
                                {quickFeatures.map((tool) => {
                                    const theme = heroColorThemes[tool.color] || heroColorThemes.blue;
                                    return (
                                        <Link
                                            key={tool.href}
                                            href={tool.href}
                                            className={`group p-3.5 rounded-2xl bg-surface/60 hover:bg-surface border border-border/60 ${theme.borderHover} flex items-center justify-between gap-3 transition-all duration-200 hover:scale-[1.01]`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`p-2.5 rounded-xl bg-surface border border-border shrink-0 ${theme.iconBoxHover} group-hover:scale-105 transition-all`}>
                                                    {tool.icon}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className={`text-sm font-bold text-foreground truncate ${theme.textHover} transition-colors`}>
                                                            {tool.title}
                                                        </p>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface font-semibold text-foreground/60 border border-border/50 shrink-0">
                                                            {tool.tag}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-foreground/60 truncate">
                                                        {tool.desc}
                                                    </p>
                                                </div>
                                            </div>
                                            <ArrowRight className={`w-4 h-4 text-foreground/40 ${theme.arrowHover} group-hover:translate-x-1 transition-all shrink-0`} />
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Panel Footer Action */}
                            <Link
                                href="#tools"
                                className="block text-center py-3 rounded-xl bg-surface/50 hover:bg-surface text-xs font-bold text-foreground/70 hover:text-foreground border border-border/60 transition-colors"
                            >
                                <span className="inline-flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                                    Lihat Semua 22 Alat Gratis
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Scroll Indicator to Tools */}
            <div className="pt-4 pb-2 flex justify-center w-full z-10">
                <Link
                    href="#tools"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-foreground/50 hover:text-foreground transition-colors py-2 px-4 rounded-full bg-surface/50 hover:bg-surface border border-border/50 backdrop-blur-sm animate-bounce"
                >
                    <span>Koleksi Alat Lengkap di Bawah</span>
                    <ArrowDown className="w-3.5 h-3.5 text-primary" />
                </Link>
            </div>
        </section>
    );
}
