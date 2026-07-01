import Header from "@/components/layout/Header";
import ClientPdfToWord from "@/components/home/ClientPdfToWord";

export default function PdfToWordPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-12 md:py-24">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-300">
                            PDF ke Word
                        </h1>
                        <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
                            Ubah dokumen PDF Anda menjadi file Word (.docx) yang dapat diedit dengan mudah.
                        </p>
                    </div>

                    <ClientPdfToWord />
                </div>
            </main>
        </div>
    );
}
