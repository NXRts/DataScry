import Header from "@/components/layout/Header";
import ClientWatermarkImageWrapper from "@/components/tools/ClientWatermarkImageWrapper";
import { Stamp, ShieldCheck, Zap, Lock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Cap Air & Watermark Foto (KTP, SIM & Portofolio) | DataScry",
    description: "Beri cap teks pengaman anti-pinjol pada scan KTP, SIM, NPWP, atau stempel logo transparan pada foto secara instan. 100% lokal di browser tanpa kirim ke server.",
};

export default function WatermarkImagePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-4 sm:py-6 md:py-12">
                <div className="max-w-5xl mx-auto space-y-5 sm:space-y-8">
                    {/* Header Top */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="p-2 sm:p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 shrink-0">
                                <Stamp className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight">
                                Cap Air & Watermark Foto
                            </h1>
                        </div>
                        <p className="text-foreground/70 text-xs sm:text-sm md:text-base leading-relaxed">
                            Bubuhi teks pengaman miring (contoh: <em>HANYA UNTUK VERIFIKASI APLIKASI X - TGL DD/MM/YY</em>) atau stempel logo transparan pada scan KTP, SIM, portofolio, dan foto produk Anda 100% lokal di peramban tanpa server.
                        </p>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-[11px] sm:text-xs text-foreground/70">
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Cegah Penyalahgunaan Pinjol Ilegal
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <Zap className="w-3.5 h-3.5" />
                            Pola Berulang (Tiled Grid) Anti-Crop
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-surface border border-border/60 font-medium">
                            <Lock className="w-3.5 h-3.5 text-foreground/50" />
                            100% Client-Side Tanpa Unggah
                        </span>
                    </div>

                    {/* Interactive Watermark Image Tool Component */}
                    <ClientWatermarkImageWrapper />
                </div>
            </main>
        </div>
    );
}
