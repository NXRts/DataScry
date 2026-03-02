import Link from "next/link";
import { Lock } from "lucide-react";

export default function CtaSection() {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

            <div className="container mx-auto px-4 max-w-4xl">
                <div className="glass-panel relative rounded-[3rem] p-10 md:p-16 border border-primary/20 text-center overflow-hidden shadow-2xl shadow-primary/10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10 space-y-8 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg mb-2">
                            <Lock className="w-8 h-8 text-white" />
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
                            className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-white bg-foreground hover:bg-foreground/90 dark:bg-white dark:text-black dark:hover:bg-white/90 rounded-full transition-transform hover:scale-105 shadow-2xl"
                        >
                            Mulai Olah Dokumen
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
