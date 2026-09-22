"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const ClientSignPdf = dynamic(
    () => import("@/components/tools/ClientSignPdf"),
    {
        ssr: false,
        loading: () => (
            <div className="glass-panel p-12 rounded-3xl border border-border/80 text-center space-y-4 shadow-xl">
                <Loader2 className="w-10 h-10 animate-spin text-rose-500 mx-auto" />
                <h3 className="text-lg font-bold text-foreground">Menyiapkan Engine Tanda Tangan PDF...</h3>
                <p className="text-sm text-foreground/60">Memuat modul e-sign 100% lokal di browser Anda...</p>
            </div>
        ),
    }
);

export default function ClientSignPdfWrapper() {
    return <ClientSignPdf />;
}
