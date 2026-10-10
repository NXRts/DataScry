"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
    FileImage,
    Image as ImageIcon,
    Files as FilesIcon,
    Scissors,
    Minimize2,
    ShieldCheck,
    FileSearch,
    FileText,
    FileType,
    FolderArchive,
    FolderOpen,
    RotateCw,
    Stamp,
    PenTool,
    Lock,
    Unlock,
    Eraser,
    ShieldAlert,
    Crop,
    FileStack,
    EyeOff,
    ArrowLeftRight,
    Search,
    X,
    Sparkles
} from "lucide-react";
import { ALL_TOOLS, TOOL_CATEGORIES, ToolCategory, ToolItem } from "@/lib/toolsData";

export default function HomeGrid() {
    const [selectedCategory, setSelectedCategory] = useState<ToolCategory>("all");
    const [searchQuery, setSearchQuery] = useState("");

    const renderToolIcon = (iconName: string, size = 30) => {
        switch (iconName) {
            case "ImageIcon": return <ImageIcon size={size} className="text-amber-500" />;
            case "FileImage": return <FileImage size={size} className="text-orange-500" />;
            case "Eraser": return <Eraser size={size} className="text-emerald-400" />;
            case "ArrowLeftRight": return <ArrowLeftRight size={size} className="text-amber-500" />;
            case "Crop": return <Crop size={size} className="text-teal-400" />;
            case "EyeOff": return <EyeOff size={size} className="text-rose-500" />;
            case "FilesIcon": return <FilesIcon size={size} className="text-purple-500" />;
            case "Scissors": return <Scissors size={size} className="text-pink-500" />;
            case "FileStack": return <FileStack size={size} className="text-indigo-400" />;
            case "RotateCw": return <RotateCw size={size} className="text-sky-400" />;
            case "Stamp": return <Stamp size={size} className="text-fuchsia-400" />;
            case "PenTool": return <PenTool size={size} className="text-pink-400" />;
            case "Lock": return <Lock size={size} className="text-amber-500" />;
            case "Unlock": return <Unlock size={size} className="text-emerald-400" />;
            case "ShieldAlert": return <ShieldAlert size={size} className="text-red-500" />;
            case "Minimize2": return <Minimize2 size={size} className="text-blue-500" />;
            case "FolderArchive": return <FolderArchive size={size} className="text-violet-400" />;
            case "FolderOpen": return <FolderOpen size={size} className="text-fuchsia-400" />;
            case "ShieldCheck": return <ShieldCheck size={size} className="text-lime-400" />;
            case "FileSearch": return <FileSearch size={size} className="text-cyan-400" />;
            case "FileType": return <FileType size={size} className="text-indigo-400" />;
            default: return <FileText size={size} className="text-blue-500" />;
        }
    };

    const colorThemes: Record<
        string,
        {
            badge: string;
            borderHover: string;
            titleHover: string;
            iconBgHover: string;
        }
    > = {
        amber: {
            badge: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
            borderHover: "hover:border-amber-500/50",
            titleHover: "group-hover:text-amber-400",
            iconBgHover: "group-hover:bg-amber-500/20 group-hover:border-amber-500/40",
        },
        orange: {
            badge: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
            borderHover: "hover:border-orange-500/50",
            titleHover: "group-hover:text-orange-400",
            iconBgHover: "group-hover:bg-orange-500/20 group-hover:border-orange-500/40",
        },
        purple: {
            badge: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
            borderHover: "hover:border-purple-500/50",
            titleHover: "group-hover:text-purple-400",
            iconBgHover: "group-hover:bg-purple-500/20 group-hover:border-purple-500/40",
        },
        violet: {
            badge: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
            borderHover: "hover:border-violet-500/50",
            titleHover: "group-hover:text-violet-400",
            iconBgHover: "group-hover:bg-violet-500/20 group-hover:border-violet-500/40",
        },
        fuchsia: {
            badge: "bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20",
            borderHover: "hover:border-fuchsia-500/50",
            titleHover: "group-hover:text-fuchsia-400",
            iconBgHover: "group-hover:bg-fuchsia-500/20 group-hover:border-fuchsia-500/40",
        },
        pink: {
            badge: "bg-pink-500/10 text-pink-400 border border-pink-500/20",
            borderHover: "hover:border-pink-500/50",
            titleHover: "group-hover:text-pink-400",
            iconBgHover: "group-hover:bg-pink-500/20 group-hover:border-pink-500/40",
        },
        rose: {
            badge: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
            borderHover: "hover:border-rose-500/50",
            titleHover: "group-hover:text-rose-400",
            iconBgHover: "group-hover:bg-rose-500/20 group-hover:border-rose-500/40",
        },
        red: {
            badge: "bg-red-500/10 text-red-400 border border-red-500/20",
            borderHover: "hover:border-red-500/50",
            titleHover: "group-hover:text-red-400",
            iconBgHover: "group-hover:bg-red-500/20 group-hover:border-red-500/40",
        },
        blue: {
            badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
            borderHover: "hover:border-blue-500/50",
            titleHover: "group-hover:text-blue-400",
            iconBgHover: "group-hover:bg-blue-500/20 group-hover:border-blue-500/40",
        },
        sky: {
            badge: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
            borderHover: "hover:border-sky-500/50",
            titleHover: "group-hover:text-sky-400",
            iconBgHover: "group-hover:bg-sky-500/20 group-hover:border-sky-500/40",
        },
        cyan: {
            badge: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
            borderHover: "hover:border-cyan-500/50",
            titleHover: "group-hover:text-cyan-400",
            iconBgHover: "group-hover:bg-cyan-500/20 group-hover:border-cyan-500/40",
        },
        teal: {
            badge: "bg-teal-500/10 text-teal-400 border border-teal-500/20",
            borderHover: "hover:border-teal-500/50",
            titleHover: "group-hover:text-teal-400",
            iconBgHover: "group-hover:bg-teal-500/20 group-hover:border-teal-500/40",
        },
        emerald: {
            badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
            borderHover: "hover:border-emerald-500/50",
            titleHover: "group-hover:text-emerald-400",
            iconBgHover: "group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40",
        },
        lime: {
            badge: "bg-lime-500/10 text-lime-400 border border-lime-500/20",
            borderHover: "hover:border-lime-500/50",
            titleHover: "group-hover:text-lime-400",
            iconBgHover: "group-hover:bg-lime-500/20 group-hover:border-lime-500/40",
        },
        indigo: {
            badge: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
            borderHover: "hover:border-indigo-500/50",
            titleHover: "group-hover:text-indigo-400",
            iconBgHover: "group-hover:bg-indigo-500/20 group-hover:border-indigo-500/40",
        },
    };

    const filteredTools = useMemo(() => {
        return ALL_TOOLS.filter((tool: ToolItem) => {
            const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
            const q = searchQuery.toLowerCase().trim();
            const matchesQuery =
                !q ||
                tool.title.toLowerCase().includes(q) ||
                tool.description.toLowerCase().includes(q);
            return matchesCategory && matchesQuery;
        });
    }, [selectedCategory, searchQuery]);

    return (
        <div className="space-y-6">
            {/* Filter Tabs & Quick Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                {/* Horizontal Scrollable Category Chips for Mobile */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                    {TOOL_CATEGORIES.map((cat) => {
                        const isSelected = selectedCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`shrink-0 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                    isSelected
                                        ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                                        : "bg-surface/60 hover:bg-surface border border-border/70 text-foreground/70 hover:text-foreground"
                                }`}
                            >
                                <span>{cat.label}</span>
                                <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-surface border border-border/60 text-foreground/50"}`}>
                                    {cat.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Instant Live Search Input */}
                <div className="relative sm:w-64 shrink-0">
                    <Search className="w-4 h-4 text-foreground/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari alat (misal: jpg, crop)..."
                        className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-surface/70 border border-border/80 focus:border-primary/60 focus:outline-hidden text-foreground placeholder:text-foreground/40 transition-colors"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-foreground/40 hover:text-foreground text-xs cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Tools Grid */}
            {filteredTools.length === 0 ? (
                <div className="glass-panel p-12 rounded-3xl text-center space-y-3 border border-border/70">
                    <Search className="w-10 h-10 text-foreground/30 mx-auto" />
                    <h3 className="text-base font-bold text-foreground">Alat Tidak Ditemukan</h3>
                    <p className="text-xs text-foreground/60 max-w-sm mx-auto">
                        Tidak ada alat yang cocok dengan kata kunci &quot;{searchQuery}&quot;. Silakan coba istilah lain atau reset pencarian.
                    </p>
                    <button
                        onClick={() => {
                            setSearchQuery("");
                            setSelectedCategory("all");
                        }}
                        className="px-4 py-2 rounded-xl bg-surface border border-border/80 hover:bg-surface/80 text-xs font-bold text-primary transition-colors cursor-pointer"
                    >
                        Tampilkan Semua 23 Alat
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {filteredTools.map((tool) => {
                        const theme = colorThemes[tool.color] || colorThemes.blue;
                        return (
                            <Link
                                key={tool.href}
                                href={tool.href}
                                className="group block h-full"
                            >
                                <div className={`h-full glass-panel p-5 md:p-6 rounded-2xl flex flex-col justify-between gap-3 md:gap-4 transition-all duration-300 hover:scale-[1.02] hover:bg-surface/60 border-2 border-transparent ${theme.borderHover} cursor-pointer`}>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <div className={`p-2.5 md:p-3 rounded-xl transition-all duration-300 group-hover:scale-105 ${theme.badge} ${theme.iconBgHover}`}>
                                                    {renderToolIcon(tool.iconName)}
                                                </div>
                                                <h3 className={`text-base md:text-lg font-bold tracking-tight ${theme.titleHover} transition-colors line-clamp-1`}>
                                                    {tool.title}
                                                </h3>
                                            </div>
                                            {tool.badge && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 shrink-0">
                                                    {tool.badge}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-foreground/70 text-xs md:text-sm leading-relaxed line-clamp-2">
                                            {tool.description}
                                        </p>
                                    </div>

                                    {/* Action footer link kecil */}
                                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-foreground/50 group-hover:text-foreground/80 transition-colors">
                                        <span className="font-semibold">Mulai Gunakan</span>
                                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
