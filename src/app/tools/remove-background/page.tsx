import Header from "@/components/layout/Header";
import ClientRemoveBackgroundWrapper from "@/components/tools/ClientRemoveBackgroundWrapper";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Hapus Latar Belakang Foto (HD Lossless) - DataScry",
    description: "Hapus background foto secara otomatis dengan hasil potongan tajam beresolusi penuh HD. 100% lokal di browser Anda tanpa upload ke server.",
};

export default function RemoveBackgroundPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-4 sm:py-6 md:py-12">
                <div className="max-w-5xl mx-auto space-y-5 sm:space-y-8">
                    <div className="text-center space-y-2 sm:space-y-3">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-emerald-500 to-teal-300">
                            Hapus Latar Belakang Foto
                        </h1>
                        <p className="text-xs sm:text-sm md:text-base text-foreground/70 max-w-2xl mx-auto px-2">
                            Pisahkan subjek dari background dengan tepian rapi dan resolusi asli tetap terjaga (HD Lossless). 100% privat di peramban Anda.
                        </p>
                    </div>

                    <ClientRemoveBackgroundWrapper />
                </div>
            </main>
        </div>
    );
}
