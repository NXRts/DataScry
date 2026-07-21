"use client";

import dynamic from "next/dynamic";

const ClientPdfToWord = dynamic(() => import("@/components/home/ClientPdfToWord"), {
    ssr: false,
    loading: () => <div className="text-center py-12">Memuat komponen...</div>
});

export default function ClientPdfToWordWrapper() {
    return <ClientPdfToWord />;
}
