"use client";

import { useEffect, useRef, useState } from "react";

interface Point {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    originalVx: number;
    originalVy: number;
}

export default function NetworkBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [warpSpeed, setWarpSpeed] = useState(false);

    // Konami Code Logic
    useEffect(() => {
        const konamiCode = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
        let cursor = 0;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === konamiCode[cursor]) {
                cursor++;
                if (cursor === konamiCode.length) {
                    setWarpSpeed(true);
                    cursor = 0;
                    setTimeout(() => setWarpSpeed(false), 5000); // 5 seconds of warp
                }
            } else {
                cursor = 0;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let points: Point[] = [];
        let animationFrameId: number;
        let width = window.innerWidth;
        let height = window.innerHeight;

        const initPoints = () => {
            points = [];
            const numPoints = Math.floor((width * height) / 15000);
            for (let i = 0; i < numPoints; i++) {
                const vx = (Math.random() - 0.5) * 0.5;
                const vy = (Math.random() - 0.5) * 0.5;
                points.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: vx,
                    vy: vy,
                    originalVx: vx,
                    originalVy: vy,
                    radius: Math.random() * 2 + 1,
                });
            }
        };

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            initPoints();
        };

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            // Warp Speed Effect
            const speedMultiplier = warpSpeed ? 50 : 1;
            const lineColor = warpSpeed ? "rgba(50, 255, 50, " : "rgba(249, 115, 22, "; // Green for warp

            // Update and Draw Points
            ctx.fillStyle = warpSpeed ? "#0f0" : "rgba(249, 115, 22, 0.6)";
            points.forEach((p, i) => {
                // Apply speed
                if (warpSpeed) {
                    p.x += 20; // Move fast to right
                    p.y += 0;
                    if (p.x > width) p.x = 0;
                } else {
                    p.x += p.vx;
                    p.y += p.vy;
                    // Bounce off edges
                    if (p.x < 0 || p.x > width) p.vx *= -1;
                    if (p.y < 0 || p.y > height) p.vy *= -1;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();

                // Connect lines
                for (let j = i + 1; j < points.length; j++) {
                    const p2 = points[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.strokeStyle = `${lineColor}${0.2 * (1 - dist / 150)})`;
                        ctx.lineWidth = 1;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener("resize", resize);
        resize();
        draw();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [warpSpeed]);

    return (
        <canvas
            ref={canvasRef}
            className={`fixed inset-0 z-0 pointer-events-none opacity-40 transition-colors duration-1000 ${warpSpeed ? 'mix-blend-screen' : ''}`}
        />
    );
}
