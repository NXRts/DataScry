"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockKeyhole, Shield, ArrowLeft, Menu } from "lucide-react";
import MobileMenuDrawer from "./MobileMenuDrawer";

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isHomePage = pathname === "/";

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur-xl border-b border-border/70 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 h-13 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Tombol kembali hanya ditampilkan di sub-halaman */}
            {!isHomePage && (
              <Link
                href="/#tools"
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-surface/80 hover:bg-surface border border-border/70 text-foreground/70 hover:text-foreground transition-all shrink-0 active:scale-95 group"
                title="Kembali ke Daftar Alat"
              >
                <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5 sm:w-4.5 sm:h-4.5" />
              </Link>
            )}

            <Link href="/" className="flex items-center gap-1.5 sm:gap-2.5 group">
              <div className="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-xl bg-linear-to-br from-primary to-primary-focus flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform shrink-0">
                <Shield className="text-primary-content w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
              </div>
              <span className="text-base sm:text-xl md:text-2xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/80">
                DataScry
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Trust badge: ditampilkan pada layar tablet dan desktop agar navbar mobile tetap lega & proporsional */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs sm:text-sm font-medium">
              <LockKeyhole size={14} className="shrink-0" />
              <span>Privacy Guaranteed</span>
            </div>

            {/* Tombol Hamburger Mobile Menu Drawer Modern Pill */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full bg-surface/90 hover:bg-surface border border-border/80 hover:border-primary/50 text-foreground transition-all duration-200 active:scale-95 cursor-pointer shadow-sm group"
              aria-label="Buka Menu 23 Alat"
              title="Daftar 23 Alat"
            >
              <div className="flex flex-col justify-center items-center w-3 h-3 gap-0.5 sm:gap-1">
                <span className="w-3 h-0.5 bg-primary rounded-full transition-all group-hover:scale-x-110"></span>
                <span className="w-2 h-0.5 bg-foreground/80 rounded-full transition-all self-start group-hover:w-3"></span>
                <span className="w-3 h-0.5 bg-primary rounded-full transition-all group-hover:scale-x-110"></span>
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-foreground group-hover:text-primary transition-colors">Menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-over Mobile Navigation Drawer */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
}
