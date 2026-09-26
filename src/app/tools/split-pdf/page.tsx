import Header from "@/components/layout/Header";
import ClientSplitPdfWrapper from "@/components/home/ClientSplitPdfWrapper";

export default function SplitPdfPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-12 md:py-24">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-rose-500 to-rose-300">
                            Pisahkan PDF
                        </h1>
                        <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
                            Ekstrak halaman spesifik dari PDF Anda dan simpan sebagai file baru. Bebas limit server.
                        </p>
                    </div>

                    <ClientSplitPdfWrapper />
                </div>
            </main>
        </div>
    );
}
