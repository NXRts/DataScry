import Link from "next/link";
import { Lock } from "lucide-react";

export default function CtaSection() {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="glass-panel relative rounded-3xl md:rounded-[2.5rem] p-10 md:p-16 border border-border/80 text-center overflow-hidden">
                    <div className="relative z-10 space-y-8 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-surface border border-border/80 flex items-center justify-center shadow-lg mb-2">
                            <Lock className="w-8 h-8 text-primary" />
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-balance">
                                Privasi Dokumen Sepenuhnya di Tangan Anda.
                            </h2>
                            <p className="text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
                                Bebaskan diri dari kekhawatiran kebocoran data. Cobalah format pemrosesan baru yang tak tersentuh awan sekarang juga.
                            </p>
                        </div>

                        <Link
                            href="#tools"
                            className="inline-flex items-center justify-center px-8 py-4 text-base md:text-lg font-bold text-white bg-primary hover:bg-primary-focus rounded-2xl transition-all shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95"
                        >
                            Mulai Olah Dokumen
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
