"use client";

import { Calendar } from "lucide-react";

interface DateRangeSelectorProps {
    days: number;
    onChange: (days: number) => void;
}

export default function DateRangeSelector({ days, onChange }: DateRangeSelectorProps) {
    return (
        <div className="flex items-center gap-2 bg-white dark:bg-white/5 backdrop-blur-md p-1 rounded-lg border border-gray-200 dark:border-white/10 shadow-sm">
            <div className="px-2 text-gray-400">
                <Calendar className="w-4 h-4" />
            </div>
            {(Object.entries({
                "7 Days": 7,
                "30 Days": 30,
                "90 Days": 90
            }) as [string, number][]).map(([label, value]) => (
                <button
                    key={value}
                    onClick={() => onChange(value)}
                    className={`
                        px-3 py-1.5 text-xs font-medium rounded-md transition-all
                        ${days === value
                            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                            : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"}
                    `}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
