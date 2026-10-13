import Header from "@/components/layout/Header";
import ClientHome from "@/components/home/ClientHome";

export default function ScrubExifPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-4 sm:py-6 md:py-12">
                <div className="max-w-4xl mx-auto space-y-5 sm:space-y-8">
                    <div className="text-center space-y-2 sm:space-y-3">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-emerald-500 to-emerald-300">
                            Scrub EXIF Metadata
                        </h1>
                        <p className="text-xs sm:text-sm md:text-base text-foreground/70 max-w-2xl mx-auto px-2">
                            Hapus jejak digital (lokasi GPS, tipe kamera statik, dll) pada foto secara permanen tanpa upload ke server.
                        </p>
                    </div>

                    <ClientHome defaultAction="scrub" />
                </div>
            </main>
        </div>
    );
}
