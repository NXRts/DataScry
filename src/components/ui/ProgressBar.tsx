"use client";

interface ProgressBarProps {
    progress: number;
    label?: string;
    status?: "idle" | "processing" | "success" | "error";
}

export default function ProgressBar({ progress, label, status = "idle" }: ProgressBarProps) {
    const getStatusColor = () => {
        switch (status) {
            case "success":
                return "bg-emerald-500";
            case "error":
                return "bg-rose-500";
            case "processing":
                return "bg-blue-500";
            default:
                return "bg-slate-300 dark:bg-slate-700";
        }
    };

    return (
        <div className="w-full space-y-2">
            <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-foreground/80 truncate pr-4">{label || "Progress"}</span>
                <span className="text-foreground tabular-nums">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-300 ease-out rounded-full ${getStatusColor()}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
