import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ClientUpscaleImageWrapper from "@/components/tools/ClientUpscaleImageWrapper";
import { Sparkles, ShieldCheck, Zap, Lock, Maximize2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tingkatkan Resolusi Foto (AI Super-Resolution HD & 4K) | DataScry",
    description: "Perbesar resolusi foto buram 2× hingga 4× menjadi tajam, bersihkan noise JPEG, dan pulihkan detail halus untuk cetak foto atau media sosial. 100% lokal di browser Anda.",
};

export default function UpscaleImagePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-4 sm:py-6 md:py-12">
                <div className="max-w-5xl mx-auto space-y-5 sm:space-y-8">
                    {/* Header Top */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="p-2 sm:p-2.5 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/30 shrink-0 shadow-lg shadow-purple-500/10">
                                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 animate-pulse" />
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight">
                                Tingkatkan Resolusi Foto (Super-Resolution AI)
                            </h1>
                        </div>
                        <p className="text-foreground/70 text-xs sm:text-sm md:text-base leading-relaxed">
                            Perbesar foto beresolusi kecil, pas foto, gambar anime, atau dokumen buram <strong>2× hingga 4× Ultra HD</strong> dengan tepian yang tetap tajam dan minim bising (noise). Diproses 100% lokal di peramban Anda tanpa kirim data ke server cloud.
                        </p>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-[11px] sm:text-xs text-foreground/70">
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                            <Maximize2 className="w-3.5 h-3.5" />
                            Perbesar 2× hingga 4× HD
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <Zap className="w-3.5 h-3.5" />
                            Super-Resolution On-Device
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                            <Lock className="w-3.5 h-3.5" />
                            100% Privat (Zero Upload)
                        </span>
                    </div>

                    {/* Tool Workspace Component */}
                    <ClientUpscaleImageWrapper />
                </div>
            </main>

            <Footer />
        </div>
    );
}
