import Header from "@/components/layout/Header";
import ClientPdfToJpgWrapper from "@/components/home/ClientPdfToJpgWrapper";

export default function PdfToJpgPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-12 md:py-24">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-amber-300">
                            PDF ke JPG
                        </h1>
                        <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
                            Ekstrak semua halaman dari dokumen PDF Anda menjadi gambar High-Quality (JPG/PNG).
                        </p>
                    </div>

                    <ClientPdfToJpgWrapper />
                </div>
            </main>
        </div>
    );
}
