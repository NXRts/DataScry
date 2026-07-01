import Header from "@/components/layout/Header";
import ClientWordToPdf from "@/components/home/ClientWordToPdf";

export default function WordToPdfPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-12 md:py-24">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-indigo-300">
                            Word ke PDF
                        </h1>
                        <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
                            Konversi dokumen Word (.docx) Anda menjadi format PDF yang universal dan aman.
                        </p>
                    </div>

                    <ClientWordToPdf />
                </div>
            </main>
        </div>
    );
}
