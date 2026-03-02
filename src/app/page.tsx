import Header from "@/components/layout/Header";
import ClientHome from "@/components/home/ClientHome";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12 md:py-24">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/50">
              Universal Document & Photo Hub
            </h1>
            <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto">
              Compress images, scrub metadata, and manipulate PDFs effortlessly.
              Everything runs locally in your browser. <span className="font-semibold text-foreground">Zero server uploads.</span>
            </p>
          </div>

          <ClientHome />
        </div>
      </main>
    </div>
  );
}
