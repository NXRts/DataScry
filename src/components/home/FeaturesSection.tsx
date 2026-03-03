import { Shield, Zap, Infinity } from "lucide-react";

export default function FeaturesSection() {
    const FEATURES = [
        {
            title: "Super Privat (Tanpa Server)",
            description: "Semua manipulasi file baik itu ekstrak PDF atau scrubbing foto berjalan 100% di dalam browser gawai Anda berkat teknologi Web Assembly dan Web Workers.",
            icon: <Shield className="w-8 h-8 text-emerald-500" />,
            color: "emerald"
        },
        {
            title: "Sekejap Mata (Instan)",
            description: "Tanpa proses upload ke server berarti tidak ada waktu tunggu koneksi internet lelet. Semuanya diproses dengan CPU dan memori peramban Anda sendiri secara luring seketika.",
            icon: <Zap className="w-8 h-8 text-amber-500" />,
            color: "amber"
        },
        {
            title: "Gratis Tanpa Batas",
            description: "Lupakan batasan ukuran file 10MB harian dan langganan bulanan premium. Unggah PDF beratus halaman atau gambar resolusi sebesar apapun semampu gawai Anda.",
            icon: <Infinity className="w-8 h-8 text-blue-500" />,
            color: "blue"
        }
    ];

    return (
        <section className="py-20 bg-background/50 border-y border-border/50">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center space-y-4 mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Mengapa Memilih <span className="text-primary">DataScry?</span></h2>
                    <p className="text-foreground/70 max-w-2xl mx-auto text-lg pt-2">Kami merombak cara Anda mengolah file sensitif tanpa perantara pihak ketiga.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2 hidden md:block"></div>

                    {FEATURES.map((feature, idx) => (
                        <div key={idx} className="relative z-10 glass-panel p-8 rounded-3xl border border-border/50 hover:border-primary/30 transition-all hover:-translate-y-2 group shadow-xl shadow-black/5">
                            <div className={`w-16 h-16 rounded-2xl bg-${feature.color}-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-${feature.color}-500/20 transition-all`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                            <p className="text-foreground/70 leading-relaxed text-sm">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
