import Header from "@/components/layout/Header";
import ClientMergeWordWrapper from "@/components/home/ClientMergeWordWrapper";

export default function MergeWordPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-12 md:py-24">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-blue-500 to-cyan-300">
                            Gabungkan Word
                        </h1>
                        <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
                            Kombinasikan beberapa dokumen Word (.docx) menjadi satu file utuh. Atur urutan file sesuai kebutuhan Anda.
                        </p>
                    </div>

                    <ClientMergeWordWrapper />
                </div>
            </main>
        </div>
    );
}
