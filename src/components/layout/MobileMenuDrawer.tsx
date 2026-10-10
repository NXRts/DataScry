"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    X,
    Search,
    Shield,
    Sparkles,
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
    FileImage
} from "lucide-react";
import { ALL_TOOLS, TOOL_CATEGORIES, ToolCategory } from "@/lib/toolsData";

interface MobileMenuDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MobileMenuDrawer({ isOpen, onClose }: MobileMenuDrawerProps) {
    const pathname = usePathname();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<ToolCategory>("all");

    // Helper render icon berdasarkan nama ikon
    const renderToolIcon = (iconName: string, className = "w-5 h-5") => {
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
            {/* Backdrop Blur */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Slide-over Drawer Panel */}
            <div className="relative w-full max-w-sm sm:max-w-md h-full bg-background border-l border-border/80 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
                {/* Header Drawer */}
                <div className="p-4 border-b border-border/70 flex items-center justify-between bg-surface/40">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-linear-to-br from-primary to-primary-focus flex items-center justify-center shadow-md shadow-primary/20">
                            <Shield className="text-primary-content w-4 h-4" />
                        </div>
                        <div>
                            <span className="font-black text-lg text-foreground tracking-tight">DataScry Menu</span>
                            <p className="text-[10px] text-foreground/50">Navigasi Cepat 23 Alat</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-surface border border-border/70 hover:bg-surface/80 text-foreground/70 hover:text-foreground transition-all cursor-pointer"
                        aria-label="Tutup Menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar Input */}
                <div className="p-4 border-b border-border/60 bg-surface/20">
                    <div className="relative">
                        <Search className="w-4 h-4 text-foreground/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari alat (misal: jpg, compress, crop)..."
                            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-surface border border-border/80 focus:border-primary/60 focus:outline-hidden text-foreground placeholder:text-foreground/40 transition-colors"
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-foreground/40 hover:text-foreground text-xs"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filter Category Chips */}
                    <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 no-scrollbar text-xs">
                        {TOOL_CATEGORIES.map((cat) => {
                            const isSelected = selectedCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`shrink-0 px-2.5 py-1 rounded-lg font-medium text-[11px] transition-all cursor-pointer ${
                                        isSelected
                                            ? "bg-primary text-white shadow-sm shadow-primary/20"
                                            : "bg-surface/60 border border-border/60 text-foreground/60 hover:text-foreground"
                                    }`}
                                >
                                    {cat.label} ({cat.count})
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tool List Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredTools.length === 0 ? (
                        <div className="text-center py-12 text-foreground/50 space-y-2">
                            <Search className="w-8 h-8 mx-auto opacity-30" />
                            <p className="text-xs font-semibold">Alat tidak ditemukan</p>
                            <p className="text-[11px]">Coba kata kunci lain atau ubah kategori filter.</p>
                        </div>
                    ) : (
                        filteredTools.map((tool) => {
                            const isActive = pathname === tool.href;
                            return (
                                <Link
                                    key={tool.href}
                                    href={tool.href}
                                    onClick={onClose}
                                    className={`group flex items-center justify-between p-3 rounded-2xl border transition-all ${
                                        isActive
                                            ? "bg-primary/10 border-primary/50 text-primary"
                                            : "bg-surface/40 hover:bg-surface border-border/50 text-foreground"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className={`p-2 rounded-xl shrink-0 ${
                                                isActive
                                                    ? "bg-primary text-white"
                                                    : "bg-surface border border-border/60 text-foreground/80 group-hover:text-primary transition-colors"
                                            }`}
                                        >
                                            {renderToolIcon(tool.iconName, "w-4 h-4")}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-xs font-bold truncate">{tool.title}</p>
                                                {tool.badge && (
                                                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20 shrink-0">
                                                        {tool.badge}
                                                    </span>
                                                )}
                                                {isActive && (
                                                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-primary text-white font-semibold shrink-0">
                                                        Aktif
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-foreground/50 truncate">
                                                {tool.description}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-foreground/30 group-hover:text-foreground/70 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            );
                        })
                    )}
                </div>

                {/* Footer Drawer */}
                <div className="p-3.5 border-t border-border/60 bg-surface/30 flex items-center justify-between text-xs text-foreground/60">
                    <Link
                        href="/"
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 font-bold hover:text-foreground transition-colors"
                    >
                        <span>🏠 Beranda Utama</span>
                    </Link>
                    <span className="text-[10px] text-emerald-400 font-medium">
                        🛡️ 100% Offline & Privat
                    </span>
                </div>
            </div>
        </div>
    );
}
