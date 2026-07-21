"use client";

import dynamic from "next/dynamic";

const ClientMergeWord = dynamic(() => import("@/components/home/ClientMergeWord"), {
    ssr: false,
    loading: () => <div className="text-center py-12">Memuat komponen...</div>
});

export default function ClientMergeWordWrapper() {
    return <ClientMergeWord />;
}
