"use client";

import dynamic from "next/dynamic";

const ClientMergePdf = dynamic(() => import("@/components/home/ClientMergePdf"), {
    ssr: false,
});

export default function ClientMergePdfWrapper() {
    return <ClientMergePdf />;
}
