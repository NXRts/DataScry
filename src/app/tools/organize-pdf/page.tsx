import Header from "@/components/layout/Header";
import ClientOrganizePdfWrapper from "@/components/tools/ClientOrganizePdfWrapper";
import Link from "next/link";
import { ArrowLeft, FileStack, ShieldCheck, Zap, Layers } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Atur & Kelola Halaman PDF (Organize PDF) | DataScry",
    description: "Atur ulang urutan halaman PDF dengan drag & drop visual, hapus halaman kosong/salah, putar orientasi halaman, dan duplikat halaman. 100% diproses lokal di peramban Anda tanpa kirim file ke server.",
};

export default function OrganizePdfPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8 md:py-16">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header Top */}
                    <div className="flex items-center gap-4 mb-2">
                        <Link href="/#tools" className="p-2 hover:bg-surface rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
                                <FileStack className="w-8 h-8 text-purple-500" />
                                Atur & Kelola Halaman PDF
                            </h1>
                            <p className="text-foreground/70 mt-1 text-sm sm:text-base">
                                Urutkan kembali halaman dokumen (drag & drop), buang halaman yang tidak diperlukan, atau putar halaman dalam satu kisi visual interaktif.
                            </p>
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/60">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                            <Layers className="w-3.5 h-3.5" />
                            Visual Drag & Drop Reordering
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            100% Client-Side Tanpa Unggah Server
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border/60 font-medium">
                            <Zap className="w-3.5 h-3.5 text-foreground/50" />
                            Hapus, Putar & Duplikat Selektif
                        </span>
                    </div>

                    {/* Interactive Organize Tool Component */}
                    <ClientOrganizePdfWrapper />
                </div>
            </main>
        </div>
    );
}
