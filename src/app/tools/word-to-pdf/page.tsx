import Header from "@/components/layout/Header";
import ClientWordToPdfWrapper from "@/components/home/ClientWordToPdfWrapper";

export default function WordToPdfPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-4 sm:py-6 md:py-12">
                <div className="max-w-4xl mx-auto space-y-5 sm:space-y-8">
                    <div className="text-center space-y-2 sm:space-y-3">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-indigo-500 to-indigo-300">
                            Word ke PDF
                        </h1>
                        <p className="text-xs sm:text-sm md:text-base text-foreground/70 max-w-2xl mx-auto px-2">
                            Konversi dokumen Word (.docx) Anda menjadi format PDF yang universal dan aman.
                        </p>
                    </div>

                    <ClientWordToPdfWrapper />
                </div>
            </main>
        </div>
    );
}
