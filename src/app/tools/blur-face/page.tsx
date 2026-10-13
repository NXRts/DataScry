import Header from "@/components/layout/Header";
import ClientBlurFaceWrapper from "@/components/tools/ClientBlurFaceWrapper";
import { EyeOff, ShieldCheck, Lock, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sensor & Blur Privasi Foto (Wajah, Plat Nomor, NIK) | DataScry",
    description: "Sensor dan buramkan wajah, plat nomor kendaraan, NIK e-KTP, atau data pribadi pada foto secara instan. Pilihan efek Gaussian Blur, Mosaik Pikselasi, dan Sensor Hitam Pekat. 100% luring di browser tanpa kirim ke server.",
};

export default function BlurFacePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-4 sm:py-6 md:py-12">
                <div className="max-w-5xl mx-auto space-y-5 sm:space-y-8">
                    {/* Header Top */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="p-2 sm:p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 shrink-0">
                                <EyeOff className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight">
                                Sensor & Blur Privasi Foto
                            </h1>
                        </div>
                        <p className="text-foreground/70 text-xs sm:text-sm md:text-base leading-relaxed">
                            Buramkan wajah orang, plat nomor kendaraan, NIK KTP, atau nominal sensitif pada foto. Diproses 100% lokal di browser Anda.
                        </p>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-[11px] sm:text-xs text-foreground/70">
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            100% Luring Tanpa Unggah Server
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <Lock className="w-3.5 h-3.5" />
                            Privasi Foto Mutlak & Aman
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-surface border border-border/60 font-medium">
                            <Sparkles className="w-3.5 h-3.5 text-foreground/50" />
                            Gaussian Blur, Mosaik & Sensor Hitam
                        </span>
                    </div>

                    {/* Interactive Blur & Privacy Tool Component */}
                    <ClientBlurFaceWrapper />
                </div>
            </main>
        </div>
    );
}
