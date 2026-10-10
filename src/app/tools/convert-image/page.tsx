import Header from "@/components/layout/Header";
import ClientConvertImageWrapper from "@/components/tools/ClientConvertImageWrapper";
import { ArrowLeftRight, ShieldCheck, Zap, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Konverter Format Gambar Universal Online (WebP, JPG, PNG, AVIF) | DataScry",
    description: "Ubah format gambar WebP ke JPG/PNG, PNG ke WebP, atau sebaliknya secara instan di peramban. Cocok untuk dokumen pendaftaran CPNS, BUMN & web. 100% lokal, cepat & bebas server.",
    keywords: [
        "konversi webp ke jpg",
        "convert webp to png",
        "ubah gambar ke jpg",
        "konverter gambar online",
        "image converter offline",
        "convert png to webp",
        "foto cpns bumn jpg",
        "datascry converter"
    ]
};

export default function ConvertImagePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-5 sm:py-8 md:py-12">
                <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
                    {/* Header Top */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="p-2 sm:p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 shrink-0">
                                <ArrowLeftRight className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <h1 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
                                Konverter Format Gambar Universal
                            </h1>
                        </div>
                        <p className="text-foreground/70 text-xs sm:text-base leading-relaxed">
                            Ubah berkas WebP, JPG, PNG, AVIF, dan format lainnya secara massal langsung di peramban. Cepat, hemat kuota, dan privasi 100% terlindungi.
                        </p>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-[11px] sm:text-xs text-foreground/70">
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            100% Client-Side
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                            <Sparkles className="w-3.5 h-3.5" />
                            WebP ⇄ JPG ⇄ PNG ⇄ AVIF
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border/60 font-medium">
                            <Zap className="w-3.5 h-3.5 text-foreground/50" />
                            Batch Multi-File & ZIP
                        </span>
                    </div>

                    {/* Interactive Convert Image Component */}
                    <ClientConvertImageWrapper />
                </div>
            </main>
        </div>
    );
}
