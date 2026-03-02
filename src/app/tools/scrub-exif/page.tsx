import Header from "@/components/layout/Header";
import ClientHome from "@/components/home/ClientHome";

export default function ScrubExifPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-12 md:py-24">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-emerald-300">
                            Scrub EXIF Metadata
                        </h1>
                        <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
                            Hapus jejak digital (lokasi GPS, tipe kamera statik, dll) pada foto secara permanen tanpa upload ke server.
                        </p>
                    </div>

                    <ClientHome defaultAction="scrub" />
                </div>
            </main>
        </div>
    );
}
