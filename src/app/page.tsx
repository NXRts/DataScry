import Header from "@/components/layout/Header";
import HomeGrid from "@/components/home/HomeGrid";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import PhilosophySection from "@/components/home/PhilosophySection";
import CtaSection from "@/components/home/CtaSection";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 w-full flex flex-col">
        {/* 1. Hero / Header Atas Besar */}
        <HeroSection />

        {/* 2. Etalase / Tools Grid */}
        <div id="tools" className="container mx-auto px-4 pt-20 pb-28 scroll-mt-24">
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Koleksi Alat Super
              </h2>
              <p className="text-foreground/70 text-lg max-w-2xl mx-auto">
                Ketuk pilihan alat di bawah ini untuk memulai transformasi berkas Anda secara aman.
              </p>
            </div>
            <HomeGrid />
          </div>
        </div>

        {/* 3. Penjelasan Privasi / Features */}
        <FeaturesSection />

        {/* 4. Filosofi DataScry */}
        <PhilosophySection />

        {/* 5. Kalimat Penutup (CTA) */}
        <CtaSection />
      </main>
    </div>
  );
}
