import Header from "@/components/layout/Header";
import ClientBlurFaceWrapper from "@/components/tools/ClientBlurFaceWrapper";
import Link from "next/link";
import { ArrowLeft, EyeOff, ShieldCheck, Lock, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sensor & Blur Privasi Foto (Wajah, Plat Nomor, NIK) | DataScry",
    description: "Sensor dan buramkan wajah, plat nomor kendaraan, NIK e-KTP, atau data pribadi pada foto secara instan. Pilihan efek Gaussian Blur, Mosaik Pikselasi, dan Sensor Hitam Pekat. 100% luring di browser tanpa kirim ke server.",
};

export default function BlurFacePage() {
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
                                <EyeOff className="w-8 h-8 text-rose-500" />
                                Sensor & Blur Privasi Foto
                            </h1>
                            <p className="text-foreground/70 mt-1 text-sm sm:text-base">
                                Buramkan wajah orang, plat nomor kendaraan, NIK KTP, atau nominal sensitif pada foto. Diproses 100% lokal di browser Anda.
                            </p>
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/60">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            100% Luring Tanpa Unggah Server
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <Lock className="w-3.5 h-3.5" />
                            Privasi Foto Mutlak & Aman
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border/60 font-medium">
                            <Sparkles className="w-3.5 h-3.5 text-foreground/50" />
                            Gaussian Blur, Mosaik & Sensor Hitam
                        </span>
                    </div>

                    {/* Interactive Blur & Privacy Tool Component */}
                    <ClientBlurFaceWrapper />
                </div>
            </main>
        </div>
    );
}
