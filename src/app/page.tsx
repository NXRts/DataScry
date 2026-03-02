import Header from "@/components/layout/Header";
import HomeGrid from "@/components/home/HomeGrid";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12 md:py-24">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/50">
              Semua Alat Dokumen yang Anda Butuhkan
            </h1>
            <p className="text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto">
              PrivaKit menawarkan pemrosesan file <span className="font-semibold text-foreground">100% Offline di Browser</span>.
              Dokumen Anda tidak pernah diunggah ke server mana pun, menjamin privasi absolut.
            </p>
          </div>

          <HomeGrid />
        </div>
      </main>
    </div>
  );
}
