import Header from "@/components/layout/Header";
import ClientCompress from "@/components/tools/ClientCompress";
import { Minimize2, ShieldCheck, Zap, Lock } from "lucide-react";

export default function CompressPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-4 sm:py-6 md:py-12">
                <div className="max-w-4xl mx-auto space-y-5 sm:space-y-8">
                    {/* Header Top */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="p-2 sm:p-2.5 rounded-2xl bg-blue-500/10 text-blue-500 shrink-0">
                                <Minimize2 className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight">
                                Kompres PDF & Gambar
                            </h1>
                        </div>
                        <p className="text-foreground/70 text-xs sm:text-sm md:text-base leading-relaxed">
                            Perkecil ukuran dokumen PDF dan foto (JPG, PNG, WebP) dengan kontrol preset atau target KB presisi 100% lokal.
                        </p>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-[11px] sm:text-xs text-foreground/70">
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Tanpa Kirim ke Server
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                            <Zap className="w-3.5 h-3.5" />
                            Target KB Khusus CASN / BKN
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-surface border border-border/60 font-medium">
                            <Lock className="w-3.5 h-3.5 text-foreground/50" />
                            Privasi Terjamin 100%
                        </span>
                    </div>

                    {/* Interactive Compression Component */}
                    <ClientCompress />
                </div>
            </main>
        </div>
    );
}
