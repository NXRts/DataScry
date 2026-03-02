import Header from "@/components/layout/Header";
import ClientHome from "@/components/home/ClientHome";

export default function CompressPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-12 md:py-24">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-300">
                            Kompresi File Lokal
                        </h1>
                        <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
                            Perkecil ukuran dokumen PDF dan foto (JPG/PNG). Semua diproses aman di *browser* Anda.
                        </p>
                    </div>

                    <ClientHome defaultAction="compress" />
                </div>
            </main>
        </div>
    );
}
