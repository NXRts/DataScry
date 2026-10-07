import Header from "@/components/layout/Header";
import ClientCropImageWrapper from "@/components/tools/ClientCropImageWrapper";
import Link from "next/link";
import { ArrowLeft, Crop, ShieldCheck, Zap, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Potong & Ubah Ukuran Pas Foto Online (Crop & Resize) | DataScry",
    description: "Potong foto dan sesuaikan ukuran pas foto resmi 2x3, 3x4, 4x6 cm untuk CPNS, BUMN, ijazah, atau paspor. Dilengkapi pengaturan resolusi piksel dan rasio aspek bebas. 100% lokal di browser Anda.",
};

export default function CropImagePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8 md:py-16">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Header Top */}
                    <div className="flex items-center gap-4 mb-2">
                        <Link href="/#tools" className="p-2 hover:bg-surface rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
                                <Crop className="w-8 h-8 text-emerald-500" />
                                Potong & Ubah Ukuran Foto (Crop & Resize)
                            </h1>
                            <p className="text-foreground/70 mt-1 text-sm sm:text-base">
                                Potong pas foto resmi 2×3, 3×4, 4×6 cm untuk syarat CPNS/BUMN, avatar profil, atau atur resolusi piksel presisi secara lokal.
                            </p>
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/60">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            100% Luring Tanpa Unggah Server
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-medium">
                            <Sparkles className="w-3.5 h-3.5" />
                            Preset Pas Foto Resmi Indonesia
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border/60 font-medium">
                            <Zap className="w-3.5 h-3.5 text-foreground/50" />
                            Bebas Atur Piksel & Rasio Aspek
                        </span>
                    </div>

                    {/* Interactive Crop Tool Component */}
                    <ClientCropImageWrapper />
                </div>
            </main>
        </div>
    );
}
