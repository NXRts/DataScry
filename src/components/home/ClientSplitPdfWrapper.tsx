"use client";

import dynamic from "next/dynamic";

const ClientSplitPdf = dynamic(() => import("@/components/home/ClientSplitPdf"), {
    ssr: false,
});

export default function ClientSplitPdfWrapper() {
    return <ClientSplitPdf />;
}
