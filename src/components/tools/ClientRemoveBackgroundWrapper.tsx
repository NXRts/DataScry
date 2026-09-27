"use client";

import dynamic from "next/dynamic";

const ClientRemoveBackground = dynamic(
    () => import("@/components/tools/ClientRemoveBackground"),
    {
        ssr: false,
        loading: () => (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-sm font-medium text-foreground/70 animate-pulse">
                    Memuat antarmuka Hapus Latar Belakang...
                </p>
            </div>
        ),
    }
);

export default function ClientRemoveBackgroundWrapper() {
    return <ClientRemoveBackground />;
}
