"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface CustomDropdownOption {
    id: string;
    label: string;
    badge?: string;
    description?: string;
    icon?: React.ReactNode;
}

interface CustomDropdownSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: CustomDropdownOption[];
    label?: string;
    placeholder?: string;
    className?: string;
    accentColor?: "rose" | "purple" | "amber" | "emerald" | "blue";
    disabled?: boolean;
}

export default function CustomDropdownSelect({
    value,
    onChange,
    options,
    label,
    placeholder = "Pilih opsi...",
    className = "",
    accentColor = "amber",
    disabled = false
}: CustomDropdownSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.id === value);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const borderFocusClasses = {
        rose: "focus:border-rose-500/80 focus:ring-rose-500/20",
        purple: "focus:border-purple-500/80 focus:ring-purple-500/20",
        amber: "focus:border-amber-500/80 focus:ring-amber-500/20",
        emerald: "focus:border-emerald-500/80 focus:ring-emerald-500/20",
        blue: "focus:border-blue-500/80 focus:ring-blue-500/20",
    };

    const activeItemClasses = {
        rose: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
        purple: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
        amber: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        emerald: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        blue: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    };

    const checkIconClasses = {
        rose: "text-rose-500",
        purple: "text-purple-500",
        amber: "text-amber-500",
        emerald: "text-emerald-500",
        blue: "text-blue-500",
    };

    const focusClass = borderFocusClasses[accentColor] || borderFocusClasses.amber;
    const activeClass = activeItemClasses[accentColor] || activeItemClasses.amber;
    const checkClass = checkIconClasses[accentColor] || checkIconClasses.amber;

    return (
        <div className={`space-y-1.5 ${className}`} ref={dropdownRef}>
            {label && (
                <label className="block text-xs font-bold text-foreground/80 tracking-wide uppercase">
                    {label}
                </label>
            )}

            <div className="relative">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-surface/90 border border-border/80 text-foreground text-left shadow-inner transition-all cursor-pointer ${
                        isOpen ? "border-foreground/40 ring-2 ring-foreground/10" : "hover:border-foreground/30"
                    } ${focusClass} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        {selectedOption?.icon && (
                            <span className="shrink-0 text-foreground/70">{selectedOption.icon}</span>
                        )}
                        <span className="font-semibold text-xs sm:text-sm truncate">
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                        {selectedOption?.badge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface border border-border/60 text-foreground/60 shrink-0">
                                {selectedOption.badge}
                            </span>
                        )}
                    </div>
                    <ChevronDown
                        className={`w-4 h-4 text-foreground/50 transition-transform duration-200 shrink-0 ${
                            isOpen ? "rotate-180" : ""
                        }`}
                    />
                </button>

                {isOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-neutral-900/95 border border-border rounded-xl shadow-2xl p-1.5 space-y-1 backdrop-blur-xl animate-fade-in max-h-64 overflow-y-auto">
                        {options.map((option) => {
                            const isSelected = option.id === value;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                        isSelected
                                            ? activeClass
                                            : "hover:bg-surface/80 text-foreground/80 hover:text-foreground"
                                    }`}
                                >
                                    <div className="flex items-start gap-2.5 min-w-0">
                                        {option.icon && (
                                            <span className="mt-0.5 shrink-0 text-foreground/70">
                                                {option.icon}
                                            </span>
                                        )}
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-xs sm:text-sm truncate">
                                                    {option.label}
                                                </span>
                                                {option.badge && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-surface/80 border border-border/50 text-foreground/60 shrink-0">
                                                        {option.badge}
                                                    </span>
                                                )}
                                            </div>
                                            {option.description && (
                                                <p className="text-[11px] text-foreground/50 mt-0.5 line-clamp-1">
                                                    {option.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {isSelected && <Check className={`w-4 h-4 shrink-0 ${checkClass}`} />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
