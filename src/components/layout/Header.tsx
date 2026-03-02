import { LockKeyhole } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/10 dark:border-white/5">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white">
            <LockKeyhole size={18} />
          </div>
          <span className="font-bold text-xl tracking-tight">PrivaKit</span>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-sm font-medium">
          <LockKeyhole size={14} />
          <span>Privacy Guaranteed</span>
        </div>
      </div>
    </header>
  );
}
