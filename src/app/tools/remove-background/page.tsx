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

            <main className="flex-1 container mx-auto px-4 py-12 md:py-24">
                <div className="max-w-5xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-emerald-500 to-teal-300">
                            Hapus Latar Belakang Foto
                        </h1>
                        <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
                            Pisahkan subjek dari background dengan tepian rapi dan resolusi asli tetap terjaga (HD Lossless). 100% privat di peramban Anda.
                        </p>
                    </div>

                    <ClientRemoveBackgroundWrapper />
                </div>
            </main>
        </div>
    );
}
