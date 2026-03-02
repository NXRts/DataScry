"use client";

import dynamic from "next/dynamic";

const ClientPdfToJpg = dynamic(() => import("@/components/home/ClientPdfToJpg"), {
    ssr: false,
});

export default function ClientPdfToJpgWrapper() {
    return <ClientPdfToJpg />;
}
