import Header from "@/components/layout/Header";
import ClientSignPdfWrapper from "@/components/tools/ClientSignPdfWrapper";
import Link from "next/link";
import { ArrowLeft, PenTool, ShieldCheck, Zap, Lock } from "lucide-react";

export default function SignPdfPage() {
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
                                <PenTool className="w-8 h-8 text-rose-500" />
                                Tanda Tangan Digital PDF (e-Sign)
                            </h1>
                            <p className="text-foreground/70 mt-1 text-sm sm:text-base">
                                Gambar tanda tangan di layar, unggah foto paraf (transparan otomatis), atau ketik nama Anda lalu tempatkan langsung di dokumen PDF secara 100% lokal.
                            </p>
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/60">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            100% Client-Side & Rahasia
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                            <Zap className="w-3.5 h-3.5" />
                            3 Metode: Gambar, Unggah, Ketik
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border/60 font-medium">
                            <Lock className="w-3.5 h-3.5 text-foreground/50" />
                            Tanpa Server & Tanpa Langganan
                        </span>
                    </div>

                    {/* Interactive Sign Tool Component */}
                    <ClientSignPdfWrapper />
                </div>
            </main>
        </div>
    );
}
