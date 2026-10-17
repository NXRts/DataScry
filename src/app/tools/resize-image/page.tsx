import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ClientResizeImageWrapper from "@/components/tools/ClientResizeImageWrapper";
import { Scaling, ShieldCheck, Zap, Lock, Percent } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Ubah Ukuran Gambar Massal (Resize IMAGE) | DataScry",
    description: "Ubah ukuran foto JPG, PNG, WebP secara massal berdasarkan persentase atau dimensi piksel presisi untuk syarat CASN, BUMN, dan media sosial. 100% lokal di browser Anda.",
};

export default function ResizeImagePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-4 sm:py-6 md:py-12">
                <div className="max-w-5xl mx-auto space-y-5 sm:space-y-8">
                    {/* Header Top */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="p-2 sm:p-2.5 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shrink-0 shadow-lg shadow-cyan-500/10">
                                <Scaling className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight">
                                Ubah Ukuran Gambar Massal (Resize Image)
                            </h1>
                        </div>
                        <p className="text-foreground/70 text-xs sm:text-sm md:text-base leading-relaxed">
                            Perkecil atau perbesar dimensi foto JPG, PNG, atau WebP berdasarkan <strong>persentase</strong>, <strong>piksel presisi</strong>, atau <strong>batas sisi maksimal</strong> dokumen pendaftaran CASN/BUMN. Dilengkapi kunci rasio aspek anti-penyok dan unduhan batch ZIP 100% offline.
                        </p>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-[11px] sm:text-xs text-foreground/70">
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                            <Scaling className="w-3.5 h-3.5" />
                            Kunci Rasio Aspek Otomatis
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <Zap className="w-3.5 h-3.5" />
                            Stepped Downsampling HD
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                            <Lock className="w-3.5 h-3.5" />
                            100% Privat (Zero Server Upload)
                        </span>
                    </div>

                    {/* Tool Workspace Component */}
                    <ClientResizeImageWrapper />
                </div>
            </main>

            <Footer />
        </div>
    );
}
