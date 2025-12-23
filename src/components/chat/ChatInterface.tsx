"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, AudioLines, Send, User, Bot } from "lucide-react";
import ProtectedLayout from "@/components/layouts/ProtectedLayout";
import { useSearchParams, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { useAuth } from "@/hooks/useAuth";
import NetworkBackground from "@/components/landing/NetworkBackground";

export default function ChatInterface({ conversationId }: { conversationId?: string }) {
    const { user, firebaseUser } = useAuth();
    const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

    const { messages, sendMessage, isLoading, setMessages, append } = useChat({
        body: { conversationId },
        initialMessages: [],
    } as any) as any;

    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();
    const router = useRouter();

    // Check API key on mount
    useEffect(() => {
        if (user) {
            checkApiKey();
        }
    }, [user]);

    const checkApiKey = async () => {
        try {
            const token = await firebaseUser?.getIdToken();
            const res = await fetch("/api/user/api-key", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setHasApiKey(data.hasApiKey);
            } else {
                console.error("API key check failed with status:", res.status);
                setHasApiKey(false); // Default to false on error 
            }
        } catch (error) {
            console.error("Failed to check API key status", error);
            setHasApiKey(false); // Default to false on error
        }
    };

    // Fetch initial messages if conversationId exists
    useEffect(() => {
        if (conversationId && user) {
            fetchMessages();
        } else if (!conversationId) {
            setMessages([]);
        }
    }, [conversationId, user]);

    const fetchMessages = async () => {
        try {
            const token = await firebaseUser?.getIdToken();
            const res = await fetch(`/api/chat/conversations/${conversationId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                console.log("Fetched messages:", data.messages);
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (searchParams.get("new")) {
            setMessages([]);
            router.replace("/chat");
        }
    }, [searchParams, router, setMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Check if API key is configured
        if (hasApiKey === false) {
            alert("Please configure your OpenAI API key in Settings before using chat.");
            return;
        }

        const userMessage = input;
        setInput("");

        let currentConversationId = conversationId;

        if (!currentConversationId) {
            try {
                const token = await firebaseUser?.getIdToken();
                const res = await fetch("/api/chat/conversations", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ title: userMessage.slice(0, 30) })
                });

                if (res.ok) {
                    const { id } = await res.json();
                    currentConversationId = id;
                    // We don't wait for the push to complete, we start sending immediately
                    // The optimistic UI update from sendMessage will handle the visual part
                    router.push(`/chat/${id}`);
                }
            } catch (e) {
                console.error("Failed to create conversation", e);
                return;
            }
        }

        const token = await firebaseUser?.getIdToken();
        await sendMessage({
            role: 'user',
            content: userMessage,
        } as any, {
            body: { conversationId: currentConversationId },
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    };

    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert("Voice recording is not supported in this browser or environment. Please ensure you are using HTTPS or localhost.");
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await transcribeAudio(audioBlob);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Could not access microphone. Please ensure permission is granted.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const transcribeAudio = async (audioBlob: Blob) => {
        try {
            const token = await firebaseUser?.getIdToken();
            const formData = new FormData();
            formData.append("file", audioBlob, "recording.webm");

            const res = await fetch("/api/transcribe", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                if (data.text) {
                    setInput(prev => (prev ? prev + " " + data.text : data.text));
                }
            } else {
                console.error("Transcription failed");
                const errorData = await res.json();
                alert(errorData.error || "Failed to transcribe audio.");
            }
        } catch (error) {
            console.error("Error sending audio:", error);
            alert("Error sending audio for transcription.");
        }
    };

    const renderInputForm = () => (
        <div className="w-full max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
                <div className={`relative flex items-center bg-white dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/10 transition-all duration-200 shadow-md dark:shadow-lg ${isRecording
                    ? "border-red-500 ring-2 ring-red-500/20 bg-red-50 dark:bg-red-900/10"
                    : "hover:border-orange-500/30"
                    }`}>
                    <button
                        type="button"
                        className="p-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                    >
                        <Plus className="w-6 h-6" />
                    </button>

                    <input
                        value={isRecording ? "Listening..." : input}
                        onChange={handleInputChange}
                        disabled={isLoading || hasApiKey === false || isRecording}
                        placeholder={hasApiKey === false ? "Configure API key in Settings" : isLoading ? "Thinking..." : "Ask anything"}
                        className={`flex-1 bg-transparent border-none outline-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed ${isRecording ? "animate-pulse font-medium text-red-600 dark:text-red-400" : ""}`}
                    />

                    <div className="flex items-center pr-2 gap-1">
                        {input.trim() && !isRecording ? (
                            <button
                                type="submit"
                                disabled={isLoading || hasApiKey === false}
                                className="p-2 rounded-full transition-all duration-200 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={isLoading || hasApiKey === false}
                                className={`p-2 rounded-full transition-all duration-200 ${isRecording
                                    ? "bg-red-500 text-white hover:bg-red-600 transform scale-110"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                            >
                                <AudioLines className={`w-5 h-5 ${isRecording ? "animate-pulse" : ""}`} />
                            </button>
                        )}
                    </div>
                </div>
            </form>
            <div className="mt-2 text-center text-xs text-gray-500">
                DoEverything can make mistakes. Consider checking important information.
            </div>
        </div>
    );

    return (
        <ProtectedLayout disableScroll={true}>
            <div className="flex flex-col h-full bg-transparent text-gray-900 dark:text-white">

                {/* Check for guest/anonymous users */}
                {firebaseUser?.isAnonymous ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-4">
                        <h1 className="text-3xl font-semibold mb-4">Authentication Required</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-md">
                            Please log in with an email account or Google to use the chat feature.
                        </p>
                        <button
                            onClick={() => router.push("/login")}
                            className="bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Go to Login
                        </button>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                        {/* Background for New Chat Only - Restricted to Dark Mode */}
                        <div className="absolute inset-0 pointer-events-none opacity-50 hidden dark:block">
                            <NetworkBackground />
                            <div className="absolute inset-0 bg-black/20" />
                        </div>

                        <div className="relative z-10 w-full max-w-3xl">
                            <h1 className="text-3xl font-semibold mb-8 text-center text-gray-800 dark:text-transparent dark:bg-gradient-to-br dark:from-white dark:to-gray-500 dark:bg-clip-text">What can I help with?</h1>
                            {renderInputForm()}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div className="max-w-3xl mx-auto space-y-6 py-8">
                                {messages.map((m: any) => (
                                    <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex gap-3 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-200 dark:bg-gray-800'
                                                }`}>
                                                {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <div className={`p-4 rounded-2xl ${m.role === 'user'
                                                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/20'
                                                    : 'bg-white dark:bg-white/10 text-gray-800 dark:text-white border border-gray-200 dark:border-white/5 shadow-sm'
                                                    }`}>
                                                    <p className="whitespace-pre-wrap">{(m as any).content}</p>

                                                    {/* Tool Invocations Display */}
                                                    {m.toolInvocations && m.toolInvocations.length > 0 && (
                                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                            <p className="text-xs font-semibold text-gray-500 mb-2">ACTIONS TAKEN:</p>
                                                            {m.toolInvocations.map((tool: any, idx: number) => (
                                                                <div key={idx} className="bg-gray-50 dark:bg-gray-900 rounded p-2 text-xs font-mono mb-2 border border-gray-200 dark:border-gray-700">
                                                                    <div className="font-bold text-blue-600 dark:text-blue-400">{tool.toolName}</div>
                                                                    <div className="text-gray-500 overflow-x-auto">Checking... {JSON.stringify(tool.args).slice(0, 50)}...</div>
                                                                    {tool.result && (
                                                                        <div className="mt-1 text-green-600 dark:text-green-400">✓ Completed</div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Explain Logic Button */}
                                                {m.role === 'assistant' && m.toolInvocations && m.toolInvocations.length > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            const lastTool = m.toolInvocations[m.toolInvocations.length - 1];
                                                            const prompt = `Can you explain why you decided to call the tool "${lastTool.toolName}" with these arguments: ${JSON.stringify(lastTool.args)}? What was your reasoning logic?`;
                                                            append({
                                                                role: 'user',
                                                                content: prompt
                                                            } as any);
                                                        }}
                                                        className="self-start text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors ml-1"
                                                    >
                                                        <Bot className="w-3 h-3" />
                                                        Explain Logic
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input Area (Fixed Bottom) */}
                        <div className="p-4 bg-white/80 dark:bg-black/40 backdrop-blur-xl border-t border-gray-200 dark:border-white/5">
                            {renderInputForm()}
                        </div>
                    </>
                )}
            </div>
        </ProtectedLayout>
    );
}
