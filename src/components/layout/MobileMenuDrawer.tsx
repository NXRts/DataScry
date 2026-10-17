"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    X,
    Search,
    Shield,
    ChevronRight,
    ArrowLeftRight,
    Crop,
    EyeOff,
    Eraser,
    Files as FilesIcon,
    Scissors,
    FileStack,
    RotateCw,
    Stamp,
    PenTool,
    Lock,
    Unlock,
    ShieldAlert,
    Minimize2,
    FolderArchive,
    FolderOpen,
    ShieldCheck,
    FileSearch,
    FileText,
    FileType,
    Image as ImageIcon,
    FileImage,
    Home,
    Sparkles,
    Heart,
    Coffee,
    Scaling
} from "lucide-react";
import { ALL_TOOLS, TOOL_CATEGORIES, ToolCategory } from "@/lib/toolsData";

interface MobileMenuDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

// Skema warna identitas visual per alat untuk tampilan vibran & premium
const TOOL_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    amber: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30", glow: "group-hover:border-amber-500/50" },
    orange: { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30", glow: "group-hover:border-orange-500/50" },
    emerald: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", glow: "group-hover:border-emerald-500/50" },
    teal: { bg: "bg-teal-500/15", text: "text-teal-400", border: "border-teal-500/30", glow: "group-hover:border-teal-500/50" },
    rose: { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/30", glow: "group-hover:border-rose-500/50" },
    purple: { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30", glow: "group-hover:border-purple-500/50" },
    pink: { bg: "bg-pink-500/15", text: "text-pink-400", border: "border-pink-500/30", glow: "group-hover:border-pink-500/50" },
    indigo: { bg: "bg-indigo-500/15", text: "text-indigo-400", border: "border-indigo-500/30", glow: "group-hover:border-indigo-500/50" },
    sky: { bg: "bg-sky-500/15", text: "text-sky-400", border: "border-sky-500/30", glow: "group-hover:border-sky-500/50" },
    fuchsia: { bg: "bg-fuchsia-500/15", text: "text-fuchsia-400", border: "border-fuchsia-500/30", glow: "group-hover:border-fuchsia-500/50" },
    red: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30", glow: "group-hover:border-red-500/50" },
    blue: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30", glow: "group-hover:border-blue-500/50" },
    violet: { bg: "bg-violet-500/15", text: "text-violet-400", border: "border-violet-500/30", glow: "group-hover:border-violet-500/50" },
    lime: { bg: "bg-lime-500/15", text: "text-lime-400", border: "border-lime-500/30", glow: "group-hover:border-lime-500/50" },
    cyan: { bg: "bg-cyan-500/15", text: "text-cyan-400", border: "border-cyan-500/30", glow: "group-hover:border-cyan-500/50" }
};

export default function MobileMenuDrawer({ isOpen, onClose }: MobileMenuDrawerProps) {
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<ToolCategory>("all");

    // State untuk transisi buka-tutup (animasi mount & unmount 100% mulus)
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            const raf = requestAnimationFrame(() => {
                setIsAnimating(true);
            });
            return () => cancelAnimationFrame(raf);
        } else {
            setIsAnimating(false);
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 300); // 300ms sesuai durasi transisi
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Helper render icon berdasarkan nama ikon
    const renderToolIcon = (iconName: string, className = "w-4 h-4") => {
        switch (iconName) {
            case "ImageIcon": return <ImageIcon className={className} />;
            case "FileImage": return <FileImage className={className} />;
            case "Eraser": return <Eraser className={className} />;
            case "ArrowLeftRight": return <ArrowLeftRight className={className} />;
            case "Crop": return <Crop className={className} />;
            case "EyeOff": return <EyeOff className={className} />;
            case "FilesIcon": return <FilesIcon className={className} />;
            case "Scissors": return <Scissors className={className} />;
            case "FileStack": return <FileStack className={className} />;
            case "RotateCw": return <RotateCw className={className} />;
            case "Stamp": return <Stamp className={className} />;
            case "PenTool": return <PenTool className={className} />;
            case "Lock": return <Lock className={className} />;
            case "Unlock": return <Unlock className={className} />;
            case "ShieldAlert": return <ShieldAlert className={className} />;
            case "Minimize2": return <Minimize2 className={className} />;
            case "FolderArchive": return <FolderArchive className={className} />;
            case "FolderOpen": return <FolderOpen className={className} />;
            case "ShieldCheck": return <ShieldCheck className={className} />;
            case "FileSearch": return <FileSearch className={className} />;
            case "FileType": return <FileType className={className} />;
            case "Sparkles": return <Sparkles className={className} />;
            case "Scaling": return <Scaling className={className} />;
            default: return <FileText className={className} />;
        }
    };

    // Lock body scroll saat drawer aktif
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Filter tools berdasarkan kategori dan query pencarian
    const filteredTools = useMemo(() => {
        return ALL_TOOLS.filter((tool) => {
            const matchCategory = selectedCategory === "all" || tool.category === selectedCategory;
            const q = searchQuery.toLowerCase().trim();
            const matchQuery =
                !q ||
                tool.title.toLowerCase().includes(q) ||
                tool.description.toLowerCase().includes(q);
            return matchCategory && matchQuery;
        });
    }, [selectedCategory, searchQuery]);

    if (!shouldRender) return null;

    return (
        /* Fullscreen Mobile Overlay (Tanpa celah di sisi layar) */
        <div
            className={`fixed inset-0 z-50 md:hidden w-full h-dvh bg-background flex flex-col transition-all duration-300 ease-out ${
                isAnimating ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
            }`}
        >
            {/* Header Drawer Fullscreen */}
            <header className="shrink-0 border-b border-border/70 bg-surface/50 backdrop-blur-xl">
                <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-linear-to-br from-primary to-primary-focus flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
                            <Shield className="text-primary-content w-4 h-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-extrabold text-base text-foreground tracking-tight">DataScry Menu</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold border border-primary/25">
                                    {ALL_TOOLS.length} Alat
                                </span>
                            </div>
                            <p className="text-[11px] text-foreground/50">Navigasi dokumen & foto 100% offline</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-surface/80 border border-border/70 hover:bg-rose-500/10 hover:border-rose-500/30 text-foreground/70 hover:text-rose-400 transition-all duration-200 cursor-pointer active:scale-95"
                        aria-label="Tutup Menu"
                        title="Tutup Menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Search Bar Input & Filter Categories */}
            <div className="shrink-0 border-b border-border/60 bg-surface/30">
                <div className="max-w-2xl mx-auto p-4 space-y-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-foreground/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari alat (misal: jpg, compress, crop)..."
                            className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl bg-surface/80 border border-border/80 focus:border-primary/60 focus:bg-surface focus:outline-hidden text-foreground placeholder:text-foreground/40 transition-all shadow-inner"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-foreground/40 hover:text-foreground text-xs cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filter Category Grid: 2x2 on mobile, 4-col on tablet/desktop (no cut-off, no scrollbar, no glow) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {TOOL_CATEGORIES.map((cat) => {
                            const isSelected = selectedCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold text-[11px] sm:text-xs transition-colors cursor-pointer ${
                                        isSelected
                                            ? "bg-primary text-white"
                                            : "bg-surface/70 border border-border/60 text-foreground/70 hover:text-foreground hover:bg-surface"
                                    }`}
                                >
                                    <span className="truncate mr-1">{cat.label}</span>
                                    <span
                                        className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                            isSelected
                                                ? "bg-white/20 text-white"
                                                : "bg-surface border border-border/50 text-foreground/50"
                                        }`}
                                    >
                                        {cat.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Tool List Scrollable Area Fullscreen */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-2xl mx-auto space-y-2">
                    {filteredTools.length === 0 ? (
                        <div className="text-center py-16 text-foreground/50 space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-surface/50 border border-border/60 flex items-center justify-center mx-auto">
                                <Search className="w-5 h-5 opacity-40 text-primary" />
                            </div>
                            <p className="text-xs font-bold text-foreground/80">Alat Tidak Ditemukan</p>
                            <p className="text-[11px] text-foreground/50 max-w-xs mx-auto">
                                Tidak ada alat yang cocok dengan &quot;{searchQuery}&quot;. Coba istilah lain atau ubah filter.
                            </p>
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setSelectedCategory("all");
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-surface border border-border/80 hover:bg-surface/80 text-[11px] font-bold text-primary transition-colors cursor-pointer"
                            >
                                Reset Pencarian
                            </button>
                        </div>
                    ) : (
                        filteredTools.map((tool) => {
                            const isActive = pathname === tool.href;
                            const color = TOOL_COLORS[tool.color] || TOOL_COLORS.blue;

                            return (
                                <Link
                                    key={tool.href}
                                    href={tool.href}
                                    onClick={onClose}
                                    className={`group flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 ${
                                        isActive
                                            ? "bg-primary/15 border-primary/60 text-primary shadow-sm shadow-primary/10"
                                            : `bg-surface/50 hover:bg-surface border-border/60 text-foreground ${color.glow}`
                                    }`}
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        {/* Vibrant Colored Icon Box */}
                                        <div
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 ${
                                                isActive
                                                    ? "bg-primary text-white border-primary/40 shadow-sm shadow-primary/20"
                                                    : `${color.bg} ${color.text} ${color.border}`
                                            }`}
                                        >
                                            {renderToolIcon(tool.iconName, "w-4 h-4")}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className={`text-xs font-bold truncate transition-colors ${isActive ? "text-primary font-extrabold" : "text-foreground group-hover:text-foreground"}`}>
                                                    {tool.title}
                                                </p>
                                                {tool.badge && (
                                                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 shrink-0">
                                                        {tool.badge}
                                                    </span>
                                                )}
                                                {isActive && (
                                                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-primary text-white font-bold shrink-0">
                                                        Aktif
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-foreground/50 truncate leading-snug">
                                                {tool.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pl-2 shrink-0">
                                        <ChevronRight className={`w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 ${isActive ? "text-primary" : "text-foreground/30 group-hover:text-foreground/70"}`} />
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Dukung Pengembang Banner */}
            <div className="shrink-0 px-4 py-2.5 bg-surface/60 border-t border-border/70 backdrop-blur-md">
                <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground min-w-0">
                        <Heart size={14} className="fill-rose-500 text-rose-500 animate-pulse shrink-0" />
                        <span className="truncate">Dukung Pengembang:</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <a
                            href="https://saweria.co/yusufarrofi"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 dark:text-amber-400 border border-amber-500/30 transition-all active:scale-95"
                            title="Dukung lewat Saweria (QRIS, Gopay, Dana)"
                        >
                            <span>Saweria</span>
                        </a>
                        <a
                            href="https://ko-fi.com/yusufarrofi/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-500 dark:text-sky-400 border border-sky-500/30 transition-all active:scale-95"
                            title="Dukung lewat Ko-fi"
                        >
                            <Coffee size={12} className="text-sky-400" />
                            <span>Ko-fi</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Footer Drawer Fullscreen dengan Safe Area */}
            <footer className="shrink-0 border-t border-border/70 bg-surface/50 backdrop-blur-xl">
                <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between pb-8 sm:pb-4">
                    <Link
                        href="/"
                        onClick={onClose}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-border/70 hover:bg-surface/80 text-foreground/80 hover:text-foreground font-bold transition-all active:scale-95 text-xs"
                    >
                        <Home className="w-3.5 h-3.5 text-primary" />
                        <span>Beranda Utama</span>
                    </Link>

                    <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/20">
                        <Sparkles className="w-3.5 h-3.5" />
                        100% Bebas Server
                    </span>
                </div>
            </footer>
        </div>
    );
}
