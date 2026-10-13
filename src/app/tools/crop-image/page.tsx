import Header from "@/components/layout/Header";
import ClientCropImageWrapper from "@/components/tools/ClientCropImageWrapper";
import { Crop, ShieldCheck, Zap, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Potong & Ubah Ukuran Pas Foto Online (Crop & Resize) | DataScry",
    description: "Potong foto dan sesuaikan ukuran pas foto resmi 2x3, 3x4, 4x6 cm untuk CPNS, BUMN, ijazah, atau paspor. Dilengkapi pengaturan resolusi piksel dan rasio aspek bebas. 100% lokal di browser Anda.",
};

export default function CropImagePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-4 sm:py-6 md:py-12">
                <div className="max-w-5xl mx-auto space-y-5 sm:space-y-8">
                    {/* Header Top */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="p-2 sm:p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 shrink-0">
                                <Crop className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight">
                                Potong & Ubah Ukuran Foto
                            </h1>
                        </div>
                        <p className="text-foreground/70 text-xs sm:text-sm md:text-base leading-relaxed">
                            Potong pas foto resmi 2×3, 3×4, 4×6 cm untuk syarat CPNS/BUMN, avatar profil, atau atur resolusi piksel presisi secara lokal.
                        </p>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-[11px] sm:text-xs text-foreground/70">
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            100% Luring Tanpa Unggah Server
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-medium">
                            <Sparkles className="w-3.5 h-3.5" />
                            Preset Pas Foto Resmi
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-surface border border-border/60 font-medium">
                            <Zap className="w-3.5 h-3.5 text-foreground/50" />
                            Bebas Atur Piksel & Rasio
                        </span>
                    </div>

                    {/* Interactive Crop Tool Component */}
                    <ClientCropImageWrapper />
                </div>
            </main>
        </div>
    );
}
