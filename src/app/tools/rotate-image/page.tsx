import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ClientRotateImageWrapper from "@/components/tools/ClientRotateImageWrapper";
import { RotateCw, FlipHorizontal, Lock, Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Putar Gambar Massal (Rotate IMAGE & Flip Mirror) | DataScry",
    description: "Putar foto JPG, PNG, WebP 90° searah/berlawanan jarum jam, 180°, dan cermin mirror horizontal/vertikal secara massal. Unduh sekaligus via ZIP 100% lokal di browser Anda.",
};

export default function RotateImagePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-4 sm:py-6 md:py-12">
                <div className="max-w-5xl mx-auto space-y-5 sm:space-y-8">
                    {/* Header Top */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="p-2 sm:p-2.5 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 shrink-0 shadow-lg shadow-sky-500/10">
                                <RotateCw className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight">
                                Putar Gambar Massal (Rotate Image)
                            </h1>
                        </div>
                        <p className="text-foreground/70 text-xs sm:text-sm md:text-base leading-relaxed">
                            Perbaiki orientasi foto smartphone yang miring, terbalik 90° atau 180°, atau buat efek cermin cemerlang dengan <strong>Flip Horizontal / Mirror</strong> dan <strong>Flip Vertikal</strong>. Dilengkapi rotasi serentak dan unduhan massal ZIP 100% luring tanpa server.
                        </p>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-[11px] sm:text-xs text-foreground/70">
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
                            <RotateCw className="w-3.5 h-3.5" />
                            Rotasi Presisi 90° & 180°
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                            <FlipHorizontal className="w-3.5 h-3.5" />
                            Cermin Mirror (Flip H & V)
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <Zap className="w-3.5 h-3.5" />
                            HTML5 Canvas Matrix
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                            <Lock className="w-3.5 h-3.5" />
                            100% Privat (Zero Server Upload)
                        </span>
                    </div>

                    {/* Tool Workspace Component */}
                    <ClientRotateImageWrapper />
                </div>
            </main>

            <Footer />
        </div>
    );
}
