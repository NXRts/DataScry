import { Shield, Zap, Infinity } from "lucide-react";

export default function FeaturesSection() {
    const featureThemes: Record<
        string,
        {
            iconBg: string;
            borderHover: string;
            titleHover: string;
            shadowHover: string;
        }
    > = {
        emerald: {
            iconBg: "bg-emerald-500/10 group-hover:bg-emerald-500/20 border border-emerald-500/20",
            borderHover: "hover:border-emerald-500/50",
            titleHover: "group-hover:text-emerald-400",
            shadowHover: "hover:shadow-emerald-500/10",
        },
        amber: {
            iconBg: "bg-amber-500/10 group-hover:bg-amber-500/20 border border-amber-500/20",
            borderHover: "hover:border-amber-500/50",
            titleHover: "group-hover:text-amber-400",
            shadowHover: "hover:shadow-amber-500/10",
        },
        blue: {
            iconBg: "bg-blue-500/10 group-hover:bg-blue-500/20 border border-blue-500/20",
            borderHover: "hover:border-blue-500/50",
            titleHover: "group-hover:text-blue-400",
            shadowHover: "hover:shadow-blue-500/10",
        },
    };

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
                    {FEATURES.map((feature, idx) => {
                        const theme = featureThemes[feature.color] || featureThemes.blue;
                        return (
                            <div
                                key={idx}
                                className={`relative z-10 glass-panel p-8 rounded-3xl border border-border/50 ${theme.borderHover} ${theme.shadowHover} transition-all duration-300 hover:-translate-y-2 group shadow-xl shadow-black/5 cursor-default`}
                            >
                                <div className={`w-16 h-16 rounded-2xl ${theme.iconBg} flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300`}>
                                    {feature.icon}
                                </div>
                                <h3 className={`text-xl font-bold mb-3 ${theme.titleHover} transition-colors`}>
                                    {feature.title}
                                </h3>
                                <p className="text-foreground/70 leading-relaxed text-sm">
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
