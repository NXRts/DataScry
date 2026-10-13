import Header from "@/components/layout/Header";
import ClientProtectPdfWrapper from "@/components/tools/ClientProtectPdfWrapper";
import { Lock, ShieldCheck, Zap, Key } from "lucide-react";

export default function ProtectPdfPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-4 sm:py-6 md:py-12">
                <div className="max-w-5xl mx-auto space-y-5 sm:space-y-8">
                    {/* Header Top */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="p-2 sm:p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 shrink-0">
                                <Lock className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight">
                                Proteksi & Kunci Password PDF
                            </h1>
                        </div>
                        <p className="text-foreground/70 text-xs sm:text-sm md:text-base leading-relaxed">
                            Kunci dan lindungi dokumen PDF rahasia Anda dengan enkripsi standar militer AES-256 langsung di browser tanpa perantara server.
                        </p>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-[11px] sm:text-xs text-foreground/70">
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Enkripsi AES-256
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                            <Key className="w-3.5 h-3.5" />
                            100% Web Crypto
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-surface border border-border/60 font-medium">
                            <Zap className="w-3.5 h-3.5 text-foreground/50" />
                            Kompatibel Adobe Acrobat
                        </span>
                    </div>

                    {/* Interactive Protect Tool Component */}
                    <ClientProtectPdfWrapper />
                </div>
            </main>
        </div>
    );
}
