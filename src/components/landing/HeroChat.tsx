"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Loader2, Sparkles, X, Bot, ArrowRight, User } from "lucide-react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export default function HeroChat() {
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [demoOpen, setDemoOpen] = useState(false);
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
    const [streamingContent, setStreamingContent] = useState("");
    const [mounted, setMounted] = useState(false);
    const { playHover, playClick } = useSoundEffects();
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, streamingContent]);

    // Ensure portal target exists
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        playClick();
        setIsLoading(true);
        setDemoOpen(true);
        setMessages([{ role: "user", content: input }]);
        setStreamingContent("");

        try {
            const response = await fetch("/api/demo-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input })
            });

            if (!response.ok) throw new Error("Failed to fetch");
            if (!response.body) return;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                accumulated += chunk;
                setStreamingContent(accumulated);
            }

            setMessages(prev => [...prev, { role: "assistant", content: accumulated }]);
            setStreamingContent("");

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting to the demo server right now. But trust me, I'm fast!" }]);
        } finally {
            setIsLoading(false);
            setInput("");
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="relative max-w-lg mx-auto mb-12 group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-600/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-full p-2 pl-6 flex items-center gap-4 focus-within:border-orange-500/50 transition-colors shadow-2xl">
                    <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me to do something (e.g. 'Refund user #102')"
                        className="bg-transparent border-none outline-none text-white placeholder-gray-500 flex-1 h-10 w-full"
                        onMouseEnter={playHover}
                    />
                    <button
                        type="button"
                        onClick={handleSubmit}
                        onMouseEnter={playHover}
                        disabled={isLoading}
                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group-focus-within:bg-white/20"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4 ml-0.5 fill-current" />
                        )}
                    </button>
                </div>
            </form>

            {mounted && createPortal(
                <AnimatePresence>
                    {demoOpen && (
                        <motion.div
                            initial={{ x: "100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 w-full md:w-[450px] h-[60vh] md:h-full bg-black/95 backdrop-blur-xl md:backdrop-blur-md border-b md:border-b-0 md:border-l border-white/10 z-[100] shadow-2xl flex flex-col rounded-b-3xl md:rounded-none overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-gradient-to-r from-orange-500/10 to-transparent">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setDemoOpen(false)}
                                        className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <ArrowRight className="w-5 h-5 rotate-180" />
                                    </button>
                                    <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">DoEverything AI</h3>
                                        <p className="text-xs text-orange-400 font-mono">LIVE DEMO MODE</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDemoOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-700' : 'bg-orange-500/20'}`}>
                                            {msg.role === 'user' ? <User className="w-4 h-4 text-gray-300" /> : <Bot className="w-4 h-4 text-orange-500" />}
                                        </div>
                                        <div className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed ${msg.role === 'user' ? 'bg-white/10 text-white rounded-tr-none' : 'bg-orange-500/10 text-gray-200 border border-orange-500/20 rounded-tl-none'}`}>
                                            {msg.content}
                                        </div>
                                    </motion.div>
                                ))}
                                {streamingContent && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex gap-4"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                                            <Bot className="w-4 h-4 text-orange-500" />
                                        </div>
                                        <div className="p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed bg-orange-500/10 text-gray-200 border border-orange-500/20 rounded-tl-none">
                                            {streamingContent}
                                            <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-orange-500 animate-pulse" />
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Fake Input Area */}
                            <div className="p-4 border-t border-white/5 bg-black/50">
                                <div className="relative">
                                    <input
                                        type="text"
                                        disabled
                                        placeholder="This is a read-only demo..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-500 focus:outline-none cursor-not-allowed"
                                    />
                                    <div className="absolute right-2 top-2 p-1.5 bg-white/5 rounded-lg opacity-50">
                                        <ArrowRight className="w-4 h-4 text-gray-500" />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-between items-center">
                                    <p className="text-xs text-gray-600">Powered by OpenAI gpt-4o-mini</p>
                                    <a href="#features" onClick={() => setDemoOpen(false)} className="text-xs text-orange-400 hover:text-orange-300 font-medium">
                                        See full features →
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
