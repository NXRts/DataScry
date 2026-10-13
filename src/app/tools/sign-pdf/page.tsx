import Header from "@/components/layout/Header";
import ClientSignPdfWrapper from "@/components/tools/ClientSignPdfWrapper";
import { PenTool, ShieldCheck, Zap, Lock } from "lucide-react";

export default function SignPdfPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-4 sm:py-6 md:py-12">
                <div className="max-w-5xl mx-auto space-y-5 sm:space-y-8">
                    {/* Header Top */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="p-2 sm:p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 shrink-0">
                                <PenTool className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight">
                                Tanda Tangan Digital PDF (e-Sign)
                            </h1>
                        </div>
                        <p className="text-foreground/70 text-xs sm:text-sm md:text-base leading-relaxed">
                            Gambar tanda tangan di layar, unggah foto paraf (transparan otomatis), atau ketik nama Anda lalu tempatkan langsung di dokumen PDF secara 100% lokal.
                        </p>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-[11px] sm:text-xs text-foreground/70">
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            100% Client-Side
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                            <Zap className="w-3.5 h-3.5" />
                            3 Metode: Gambar, Unggah, Ketik
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-surface border border-border/60 font-medium">
                            <Lock className="w-3.5 h-3.5 text-foreground/50" />
                            Tanpa Server
                        </span>
                    </div>

                    {/* Interactive Sign Tool Component */}
                    <ClientSignPdfWrapper />
                </div>
            </main>
        </div>
    );
}
