import Header from "@/components/layout/Header";
import ClientArchiveZip from "@/components/tools/ClientArchiveZip";
import { FolderArchive, ShieldCheck, Zap, Lock } from "lucide-react";

export default function ArchiveZipPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-4 sm:py-6 md:py-12">
                <div className="max-w-4xl mx-auto space-y-5 sm:space-y-8">
                    {/* Header Top */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="p-2 sm:p-2.5 rounded-2xl bg-purple-500/10 text-purple-500 shrink-0">
                                <FolderArchive className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight">
                                Kompres Berkas ke ZIP
                            </h1>
                        </div>
                        <p className="text-foreground/70 text-xs sm:text-sm md:text-base leading-relaxed">
                            Gabungkan dan padatkan banyak file (dokumen, foto, folder data) menjadi satu arsip .ZIP terkompresi 100% lokal.
                        </p>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-[11px] sm:text-xs text-foreground/70">
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Algoritma DEFLATE di Browser
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                            <Zap className="w-3.5 h-3.5" />
                            Tanpa Batas Format File
                        </span>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-surface border border-border/60 font-medium">
                            <Lock className="w-3.5 h-3.5 text-foreground/50" />
                            Zero Server Upload
                        </span>
                    </div>

                    {/* Interactive Archive Component */}
                    <ClientArchiveZip />
                </div>
            </main>
        </div>
    );
}
