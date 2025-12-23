"use client";

import { useEffect, useState, useRef } from "react";
import { Check, Terminal, Play } from "lucide-react";

interface TerminalLine {
    type: "command" | "output" | "system" | "user" | "ai";
    content: string;
    delay?: number; // Delay before showing next line
}

const SEQUENCE: TerminalLine[] = [
    { type: "command", content: "connect webhook https://api.stripe.com/v1/customers", delay: 800 },
    { type: "system", content: "Analyzing schema...", delay: 600 },
    { type: "system", content: "Auth method: Bearer Token detected.", delay: 400 },
    { type: "output", content: "✓ Connected successfully. Created webhook 'Stripe Customers'.", delay: 1000 },

    { type: "user", content: "Refund the last transaction for user@example.com", delay: 800 },
    { type: "ai", content: "Searching for recent transactions for user@example.com...", delay: 1200 },
    { type: "system", content: "GET /v1/charges?customer=user@example.com&limit=1", delay: 600 },
    { type: "ai", content: "Found transaction ch_3N5j2L (Amount: $49.00). Processing refund...", delay: 1000 },
    { type: "system", content: "POST /v1/refunds { charge: 'ch_3N5j2L' }", delay: 800 },
    { type: "output", content: "✓ Success. Refund processed for ch_3N5j2L.", delay: 2000 },
];

export default function TerminalDemo() {
    const [lines, setLines] = useState<TerminalLine[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const [currentTypingText, setCurrentTypingText] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasPlayed, setHasPlayed] = useState(false);

    const startAnimation = () => {
        setIsPlaying(true);
        setHasPlayed(true);
        setLines([]);
        setCurrentIndex(0);
    };

    useEffect(() => {
        if (!isPlaying) return;
        if (currentIndex >= SEQUENCE.length) {
            // Loop or stop
            setTimeout(() => {
                setIsPlaying(false); // Stop at end
            }, 3000);
            return;
        }

        const currentLine = SEQUENCE[currentIndex];

        // Simulate typing for commands and user input
        if (currentLine.type === "command" || currentLine.type === "user") {
            setIsTyping(true);
            let charIndex = 0;
            setCurrentTypingText("");

            const typeInterval = setInterval(() => {
                charIndex++;
                setCurrentTypingText(currentLine.content.slice(0, charIndex));
                if (charIndex >= currentLine.content.length) {
                    clearInterval(typeInterval);
                    setIsTyping(false);
                    // Move to next line after delay
                    setTimeout(() => {
                        setLines((prev) => [...prev, currentLine]);
                        setCurrentIndex((prev) => prev + 1);
                        setCurrentTypingText("");
                    }, currentLine.delay || 500);
                }
            }, 30); // Typing speed

            return () => clearInterval(typeInterval);
        } else {
            // Instant appearance for system/output
            const timer = setTimeout(() => {
                setLines((prev) => [...prev, currentLine]);
                setCurrentIndex((prev) => prev + 1);
            }, currentLine.delay || 500);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, isPlaying]);

    return (
        <div className="relative w-full h-full bg-black/90 font-mono text-sm p-6 overflow-hidden flex flex-col" onClick={!isPlaying ? startAnimation : undefined}>
            {/* Play Overlay */}
            {!hasPlayed && !isPlaying && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer group hover:bg-black/30 transition-colors">
                    <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center backdrop-blur-md border border-orange-500/30 group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                    </div>
                    <div className="absolute mt-32 text-gray-300 font-sans text-sm animate-pulse">Click to watch demo</div>
                </div>
            )}

            {/* Replay Overlay */}
            {hasPlayed && !isPlaying && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-[2px] group opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/20 mb-4">
                            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                        </div>
                        <span className="text-white font-medium">Replay Demo</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex gap-2 mb-6 opacity-30">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>

            {/* Content */}
            <div className="space-y-3 relative z-10 flex-1 overflow-y-auto custom-scrollbar">
                {lines.map((line, i) => (
                    <div key={i} className="animate-fade-in-up">
                        {line.type === "command" && (
                            <div className="flex gap-2 text-orange-400">
                                <span>$</span>
                                <span>{line.content}</span>
                            </div>
                        )}
                        {line.type === "output" && (
                            <div className="text-green-400 font-medium">
                                {line.content}
                            </div>
                        )}
                        {line.type === "system" && (
                            <div className="text-gray-500 italic pl-4 border-l border-gray-800">
                                {line.content}
                            </div>
                        )}
                        {line.type === "user" && (
                            <div className="flex gap-2 text-blue-400 mt-4">
                                <span>user:</span>
                                <span>"{line.content}"</span>
                            </div>
                        )}
                        {line.type === "ai" && (
                            <div className="flex gap-2 text-gray-300">
                                <span className="text-purple-400">ai:</span>
                                <span>{line.content}</span>
                            </div>
                        )}
                    </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex gap-2 text-white">
                        <span className={SEQUENCE[currentIndex].type === "user" ? "text-blue-400" : "text-orange-400"}>
                            {SEQUENCE[currentIndex].type === "user" ? "user:" : "$"}
                        </span>
                        <span>
                            {SEQUENCE[currentIndex].type === "user" && "\""}
                            {currentTypingText}
                            <span className="animate-pulse inline-block w-2 h-4 bg-orange-500 ml-1 align-middle"></span>
                        </span>
                    </div>
                )}
                {isPlaying && !isTyping && (
                    <div className="animate-pulse inline-block w-2 h-4 bg-orange-500 mt-1"></div>
                )}
            </div>

            {/* Grain Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
        </div>
    );
}
