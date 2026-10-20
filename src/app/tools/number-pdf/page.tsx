import Header from "@/components/layout/Header";
import ClientNumberPdfWrapper from "@/components/tools/ClientNumberPdfWrapper";
import { Hash, ShieldCheck, Zap, BookOpen } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Penomoran Halaman Otomatis (Page Numbering PDF) | DataScry",
    description: "Beri nomor halaman otomatis pada PDF untuk skripsi, tesis, laporan dinas, dan ebook. Dukung angka Latin, Romawi (i, ii, iii), lewati sampul, dan 6 posisi peletakan presisi 100% lokal.",
};

export default function NumberPdfPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-4 sm:py-6 md:py-12">
                <div className="max-w-6xl mx-auto space-y-5 sm:space-y-8">
                    {/* Header Top */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="p-2 sm:p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 shrink-0">
                                <Hash className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight">
                                Penomoran Halaman Otomatis PDF
                            </h1>
                        </div>
                        <p className="text-foreground/70 text-xs sm:text-sm md:text-base leading-relaxed">
                            Bubuhi nomor halaman rapi dan resmi pada dokumen PDF skripsi, tesis, laporan kantor, atau ebook digital Anda. Sesuaikan posisi, format angka/Romawi, dan lewati halaman sampul secara instan tanpa server.
                        </p>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-[11px] sm:text-xs text-foreground/70">
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                            <Hash className="w-3.5 h-3.5" />
                            Bates Stamping 6 Titik
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            100% Lokal & Rahasia
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                            <BookOpen className="w-3.5 h-3.5" />
                            Lewati Sampul & Romawi
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-surface border border-border/60 font-medium">
                            <Zap className="w-3.5 h-3.5 text-foreground/50" />
                            Bebas Batas Dokumen
                        </span>
                    </div>

                    {/* Interactive Numbering Tool Component */}
                    <ClientNumberPdfWrapper />
                </div>
            </main>
        </div>
    );
}
