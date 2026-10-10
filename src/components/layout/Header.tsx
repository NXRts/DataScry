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
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Tombol kembali hanya ditampilkan di sub-halaman */}
            {!isHomePage && (
              <Link
                href="/#tools"
                className="flex items-center justify-center p-2 rounded-xl bg-surface hover:bg-surface/80 border border-border/70 text-foreground/70 hover:text-foreground transition-all mr-1 sm:mr-2 group"
                title="Kembali ke Daftar Alat"
              >
                <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-0.5 sm:w-5 sm:h-5" />
              </Link>
            )}

            <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-primary to-primary-focus flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                <Shield className="text-primary-content w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/80">
                DataScry
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Trust badge */}
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs sm:text-sm font-medium">
              <LockKeyhole size={14} className="shrink-0" />
              <span className="hidden sm:inline">Privacy Guaranteed</span>
              <span className="sm:hidden text-[11px]">100% Luring</span>
            </div>

            {/* Tombol Hamburger Mobile Menu Drawer */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden flex items-center gap-1.5 p-2 rounded-xl bg-surface border border-border/80 hover:bg-surface/80 text-foreground transition-colors cursor-pointer"
              aria-label="Buka Menu 23 Alat"
              title="Daftar Alat"
            >
              <Menu size={18} />
              <span className="text-xs font-bold text-primary">Menu</span>
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
