import Header from "@/components/layout/Header";
import ClientProtectPdfWrapper from "@/components/tools/ClientProtectPdfWrapper";
import Link from "next/link";
import { ArrowLeft, Lock, ShieldCheck, Zap, Key } from "lucide-react";

export default function ProtectPdfPage() {
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
                                <Lock className="w-8 h-8 text-amber-500" />
                                Proteksi & Kunci Password PDF
                            </h1>
                            <p className="text-foreground/70 mt-1 text-sm sm:text-base">
                                Kunci dan lindungi dokumen PDF rahasia Anda dengan enkripsi standar militer AES-256 langsung di browser tanpa perantara server.
                            </p>
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/60">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Enkripsi Militer AES-256
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                            <Key className="w-3.5 h-3.5" />
                            100% Client-Side Web Crypto
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border/60 font-medium">
                            <Zap className="w-3.5 h-3.5 text-foreground/50" />
                            Kompatibel Adobe Acrobat & PDF Reader
                        </span>
                    </div>

                    {/* Interactive Protect Tool Component */}
                    <ClientProtectPdfWrapper />
                </div>
            </main>
        </div>
    );
}
