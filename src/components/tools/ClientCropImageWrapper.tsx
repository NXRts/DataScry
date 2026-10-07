"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const ClientCropImage = dynamic(
    () => import("@/components/tools/ClientCropImage"),
    {
        ssr: false,
        loading: () => (
            <div className="glass-panel p-12 rounded-3xl border border-border/80 text-center space-y-4 shadow-xl">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
                <h3 className="text-lg font-bold text-foreground">Menyiapkan Engine Crop & Resize Foto...</h3>
                <p className="text-sm text-foreground/60">Memuat kanvas interaktif client-side di browser Anda...</p>
            </div>
        ),
    }
);

export default function ClientCropImageWrapper() {
    return <ClientCropImage />;
}
