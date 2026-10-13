import Header from "@/components/layout/Header";
import ClientMergePdfWrapper from "@/components/home/ClientMergePdfWrapper";

export default function MergePdfPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-4 sm:py-6 md:py-12">
                <div className="max-w-4xl mx-auto space-y-5 sm:space-y-8">
                    <div className="text-center space-y-2 sm:space-y-3">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-purple-500 to-purple-300">
                            Gabungkan PDF
                        </h1>
                        <p className="text-xs sm:text-sm md:text-base text-foreground/70 max-w-2xl mx-auto px-2">
                            Kombinasikan beberapa dokumen PDF menjadi satu file lengkap. Diurutkan sesuai keinginan Anda.
                        </p>
                    </div>

                    <ClientMergePdfWrapper />
                </div>
            </main>
        </div>
    );
}
