import Link from "next/link";
import { LockKeyhole, Shield, ArrowLeft } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/10 dark:border-white/5">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/" className="flex items-center justify-center p-2 rounded-lg bg-surface hover:bg-surface/80 transition-colors mr-1 sm:mr-2 group">
            <ArrowLeft size={18} className="text-foreground/70 group-hover:text-foreground transition-colors sm:w-[20px] sm:h-[20px]" />
          </Link>
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-primary-focus flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Shield className="text-primary-content w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
              DataScry
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs sm:text-sm font-medium">
          <LockKeyhole size={14} className="flex-shrink-0" />
          <span className="hidden sm:inline">Privacy Guaranteed</span>
          <span className="sm:hidden">Aman</span>
        </div>
      </div>
    </header>
  );
}
