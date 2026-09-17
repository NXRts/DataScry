import { Eye, Database, Sparkles } from "lucide-react";

export default function PhilosophySection() {
    const PILLARS = [
        {
            word: "Data",
            sub: "Informasi & Berkas Digital",
            desc: "Representasi digital dari aset paling berharga Anda—mulai dari dokumen kontrak, ijazah, arsip pribadi, hingga foto kenangan. Data adalah identitas dan hak privasi mutlak yang tidak seharusnya diserahkan ke server asing.",
            icon: <Database className="w-6 h-6 text-blue-400" />,
            badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20"
        },
        {
            word: "Scry",
            sub: "Seni Menyingkap yang Tersembunyi",
            desc: "Berasal dari kata kuno 'scrying' (seni menerawang atau melihat tabir tersembunyi melalui cermin jernih). Di dunia digital, ini melambangkan kemampuan menatap langsung ke dalam struktur file untuk melihat metadata tersembunyi, jejak GPS, dan informasi rahasia.",
            icon: <Eye className="w-6 h-6 text-purple-400" />,
            badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20"
        }
    ];

    return (
        <section className="py-24 relative overflow-hidden bg-background/30 border-t border-border/40">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Section Header */}
                <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-border text-xs sm:text-sm font-medium text-foreground/80 shadow-md">
                        <Sparkles className="text-primary w-4 h-4" />
                        <span>Filosofi di Balik Nama</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                        Mengapa Kami Menamainya{" "}
                        <span className="text-primary">DataScry</span>?
                    </h2>

                    <p className="text-foreground/70 text-base sm:text-lg leading-relaxed pt-2">
                        Nama <strong>DataScry</strong> lahir dari gabungan dua konsep: kedaulatan data modern dan seni kuno untuk menyingkap apa yang tersembunyi di balik permukaan.
                    </p>
                </div>

                {/* The Two Root Pillars */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {PILLARS.map((pillar, idx) => (
                        <div
                            key={idx}
                            className="glass-panel p-8 md:p-10 rounded-3xl border border-border/70 hover:border-primary/40 transition-all duration-300 space-y-5 relative"
                        >
                            <div className="flex items-center justify-between">
                                <div className="p-3 rounded-2xl bg-surface border border-border/80 shadow-sm">
                                    {pillar.icon}
                                </div>
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${pillar.badgeColor}`}>
                                    Akar Kata
                                </span>
                            </div>

                            <div>
                                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                                    {pillar.word}
                                </h3>
                                <p className="text-sm font-medium text-primary mt-1">
                                    {pillar.sub}
                                </p>
                            </div>

                            <p className="text-foreground/70 text-sm sm:text-base leading-relaxed">
                                {pillar.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
