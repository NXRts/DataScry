"use client";

import dynamic from "next/dynamic";

const ClientWordToPdf = dynamic(() => import("@/components/home/ClientWordToPdf"), {
    ssr: false,
});

export default function ClientWordToPdfWrapper() {
    return <ClientWordToPdf />;
}
