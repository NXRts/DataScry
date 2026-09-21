import Header from "@/components/layout/Header";
import ClientRotatePdfWrapper from "@/components/tools/ClientRotatePdfWrapper";
import Link from "next/link";
import { ArrowLeft, RotateCw, ShieldCheck, Zap, Lock } from "lucide-react";

export default function RotatePdfPage() {
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
                                <RotateCw className="w-8 h-8 text-rose-500" />
                                Putar Halaman PDF
                            </h1>
                            <p className="text-foreground/70 mt-1 text-sm sm:text-base">
                                Putar orientasi halaman PDF yang miring atau terbalik secara individual maupun serentak 100% lokal tanpa merusak kualitas teks.
                            </p>
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/60">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            100% Lossless (Kualitas Asli Terjaga)
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                            <Zap className="w-3.5 h-3.5" />
                            Pratinjau Visual Real-Time
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border/60 font-medium">
                            <Lock className="w-3.5 h-3.5 text-foreground/50" />
                            Privasi Mutlak di Browser
                        </span>
                    </div>

                    {/* Interactive Rotate PDF Tool Component */}
                    <ClientRotatePdfWrapper />
                </div>
            </main>
        </div>
    );
}
