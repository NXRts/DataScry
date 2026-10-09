import Header from "@/components/layout/Header";
import ClientUnzipWrapper from "@/components/tools/ClientUnzipWrapper";
import Link from "next/link";
import { ArrowLeft, FolderOpen, ShieldCheck, Zap, Eye } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Ekstrak & Intip Isi Berkas ZIP Online (ZIP Viewer & Extractor) | DataScry",
    description: "Buka, intip isi berkas, dan ekstrak file arsip .ZIP langsung di peramban tanpa install aplikasi tambahan. Pratinjau foto, PDF, dan teks secara aman. 100% lokal & bebas virus.",
};

export default function UnzipPage() {
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
                                <FolderOpen className="w-8 h-8 text-fuchsia-500" />
                                Ekstrak & Intip Isi Berkas ZIP
                            </h1>
                            <p className="text-foreground/70 mt-1 text-sm sm:text-base">
                                Buka arsip .ZIP, intip pratinjau foto, teks, dan dokumen, serta ekstrak berkas pilihan Anda secara instan tanpa perlu aplikasi tambahan.
                            </p>
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/60">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            100% Luring Tanpa Unggah Server
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 font-medium">
                            <Eye className="w-3.5 h-3.5" />
                            Pratinjau Gambar, Teks & PDF Instan
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border/60 font-medium">
                            <Zap className="w-3.5 h-3.5 text-foreground/50" />
                            Ekstraksi Selektif Per-Berkas
                        </span>
                    </div>

                    {/* Interactive Unzip Tool Component */}
                    <ClientUnzipWrapper />
                </div>
            </main>
        </div>
    );
}
