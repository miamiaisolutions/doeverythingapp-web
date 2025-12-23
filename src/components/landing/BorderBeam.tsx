"use client";

import { useEffect, useRef } from "react";
// Removed unused import

// I'll stick to template literals + tailwind-merge in my head to avoid dependency on utils if it doesn't exist.
// Checking package.json revealed clsx/tailwind-merge are installed, but I'll play it safe and inline.

export default function BorderBeam({
    className,
    size = 200,
    duration = 15,
    anchor = 90,
    borderWidth = 1.5,
    colorFrom = "#ffaa40",
    colorTo = "#9c40ff",
    delay = 0,
}: {
    className?: string;
    size?: number;
    duration?: number;
    anchor?: number;
    borderWidth?: number;
    colorFrom?: string;
    colorTo?: string;
    delay?: number;
}) {
    return (
        <div
            style={
                {
                    "--size": size,
                    "--duration": duration,
                    "--anchor": anchor,
                    "--border-width": borderWidth,
                    "--color-from": colorFrom,
                    "--color-to": colorTo,
                    "--delay": delay,
                } as React.CSSProperties
            }
            className={`pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent] ${className}`}
        >
            <div
                className="[mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
                style={{
                    maskClip: "padding-box, border-box",
                    maskComposite: "intersect",
                }}
            >
                <span
                    className="absolute aspect-square w-[calc(var(--size)*1px)] animate-border-beam bg-gradient-to-l from-[var(--color-from)] via-[var(--color-to)] to-transparent"
                    style={{
                        left: "calc(var(--anchor) * 1%)",
                        top: "calc(var(--anchor) * 1%)",
                        offsetPath: "rect(0 auto auto 0 round calc(var(--size) * 1px))",
                        // Simple Fallback: Just rotate. A true border beam needs complex offset-path usually not supported well in all contexts without polyfill or specific CSS
                        // I will use a simpler approach: A rotating gradient conic.
                    }}
                />
                {/* Improved Implementation: Conic Rotating Gradient Mask */}
                <div className="absolute inset-0 rounded-[inherit] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] opacity-50 mix-blend-screen" style={{ animationDuration: `${duration}s` }}></div>

            </div>
        </div>
    );
}
