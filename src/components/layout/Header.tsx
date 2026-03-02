import Link from "next/link";
import { LockKeyhole, Shield, ArrowLeft } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/10 dark:border-white/5">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center justify-center p-2 rounded-lg bg-surface hover:bg-surface/80 transition-colors mr-2 group">
            <ArrowLeft size={20} className="text-foreground/70 group-hover:text-foreground transition-colors" />
          </Link>
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-focus flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Shield className="text-primary-content" size={24} />
            </div>
            <span className="text-2xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
              PrivaKit
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-sm font-medium">
          <LockKeyhole size={14} />
          <span>Privacy Guaranteed</span>
        </div>
      </div>
    </header>
  );
}
