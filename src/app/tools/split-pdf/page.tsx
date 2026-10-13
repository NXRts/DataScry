import Header from "@/components/layout/Header";
import ClientSplitPdfWrapper from "@/components/home/ClientSplitPdfWrapper";

export default function SplitPdfPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-4 sm:py-6 md:py-12">
                <div className="max-w-4xl mx-auto space-y-5 sm:space-y-8">
                    <div className="text-center space-y-2 sm:space-y-3">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-rose-500 to-rose-300">
                            Pisahkan PDF
                        </h1>
                        <p className="text-xs sm:text-sm md:text-base text-foreground/70 max-w-2xl mx-auto px-2">
                            Ekstrak halaman spesifik dari PDF Anda dan simpan sebagai file baru. Bebas limit server.
                        </p>
                    </div>

                    <ClientSplitPdfWrapper />
                </div>
            </main>
        </div>
    );
}
