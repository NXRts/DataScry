import Header from "@/components/layout/Header";
import ClientConvertImageWrapper from "@/components/tools/ClientConvertImageWrapper";
import Link from "next/link";
import { ArrowLeft, ArrowLeftRight, ShieldCheck, Zap, Sparkles } from "lucide-react";
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

            <main className="flex-1 container mx-auto px-4 py-8 md:py-16">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Header Top */}
                    <div className="flex items-center gap-4 mb-2">
                        <Link href="/#tools" className="p-2 hover:bg-surface rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
                                <ArrowLeftRight className="w-8 h-8 text-amber-500" />
                                Konverter Format Gambar Universal
                            </h1>
                            <p className="text-foreground/70 mt-1 text-sm sm:text-base">
                                Ubah berkas WebP, JPG, PNG, AVIF, dan format lainnya secara massal langsung di peramban. Cepat, hemat kuota, dan privasi 100% terlindungi.
                            </p>
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/60">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            100% Client-Side Tanpa Unggah Server
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                            <Sparkles className="w-3.5 h-3.5" />
                            WebP ⇄ JPG ⇄ PNG ⇄ AVIF Bebas Batas
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border/60 font-medium">
                            <Zap className="w-3.5 h-3.5 text-foreground/50" />
                            Batch Multi-File & Ekspor ZIP
                        </span>
                    </div>

                    {/* Interactive Convert Image Component */}
                    <ClientConvertImageWrapper />
                </div>
            </main>
        </div>
    );
}
