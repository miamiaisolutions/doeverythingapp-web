"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    MessageSquare,
    Settings,
    LogOut,

    ChevronRight,
    ChevronLeft,
    Box,
    Webhook,
    UserCircle,
    MoreVertical,
    Trash2,
    Edit2,
    Check,
    X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useState, useEffect, useRef } from "react";


export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, firebaseUser } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [conversations, setConversations] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpenId(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (user) {
            fetchConversations();
        }
    }, [user, pathname]); // Refetch on navigation (e.g. after creating new chat)

    const fetchConversations = async () => {
        try {
            const token = await firebaseUser?.getIdToken();
            const res = await fetch("/api/chat/conversations", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations);
            }
        } catch (error) {
            console.error("Failed to fetch conversations", error);
        }
    };

    const handleRename = async (id: string) => {
        if (!editTitle.trim()) {
            setEditingId(null);
            return;
        }

        try {
            const token = await firebaseUser?.getIdToken();
            const res = await fetch(`/api/chat/conversations/${id}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ title: editTitle }),
            });

            if (res.ok) {
                setConversations(conversations.map(c => c.id === id ? { ...c, title: editTitle } : c));
            }
        } catch (error) {
            console.error("Failed to rename conversation", error);
        } finally {
            setEditingId(null);
            setMenuOpenId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this conversation?")) return;

        try {
            const token = await firebaseUser?.getIdToken();
            const res = await fetch(`/api/chat/conversations/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setConversations(conversations.filter(c => c.id !== id));
                if (pathname === `/chat/${id}`) {
                    router.push("/chat");
                }
            }
        } catch (error) {
            console.error("Failed to delete conversation", error);
        } finally {
            setMenuOpenId(null);
        }
    };

    const startEditing = (id: string, title: string) => {
        setEditingId(id);
        setEditTitle(title);
        setMenuOpenId(null);
    };


    const handleSignOut = async () => {
        await signOut(auth);
        router.push("/");
    };

    const navItems = [

        { icon: Webhook, label: "Webhooks", href: "/webhooks" },
    ];

    const accountItems = [
        { icon: LayoutDashboard, label: "Analytics", href: "/dashboard" },
        { icon: Settings, label: "Settings", href: "/settings" },
    ];

    return (
        <div
            className={`
                flex flex-col h-screen bg-black/80 backdrop-blur-xl text-gray-300 transition-all duration-300 border-r border-white/5 relative
                ${collapsed ? "w-16" : "w-64"}
            `}
        >
            {/* Header / Toggle */}
            <div className="p-4 flex items-center justify-between border-b border-white/5">
                {!collapsed && (
                    <div className="font-bold text-white flex items-center gap-2">
                        <Box className="w-6 h-6 text-orange-500" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
                            DoEverything
                        </span>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
                >
                    {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                </button>
            </div>

            {/* New Chat & New Project Buttons */}
            <div className="p-3 space-y-2">
                <button
                    onClick={() => router.push(`/chat?new=${Date.now()}`)}
                    className={`
                        flex items-center gap-2 w-full bg-gradient-to-r from-orange-500 to-red-600 text-white hover:opacity-90 rounded-lg transition-all shadow-lg shadow-orange-500/20
                        ${collapsed ? "justify-center p-2" : "px-4 py-2"}
                    `}
                >
                    <MessageSquare className="w-5 h-5" />
                    {!collapsed && <span>New Chat</span>}
                </button>

            </div>

            {/* Sticky Top Navigation (Dashboard & Webhooks) */}
            <div className="px-3 space-y-1 mb-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                                flex items-center gap-3 px-3 py-2 rounded-lg transition-all
                                ${isActive
                                    ? "bg-white/5 text-orange-400 border-l-2 border-orange-500 rounded-l-none"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                }
                                ${collapsed ? "justify-center" : ""}
                            `}
                        >
                            <Icon className="w-5 h-5" />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </div>

            {/* Separator */}
            <div className="border-t border-white/5 mx-3 mb-2" />

            {/* Scrollable Navigation */}
            <nav className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                {/* Recent Conversations Section */}
                {!collapsed && (
                    <div className="px-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Recent Conversations
                        </h3>
                        <div className="space-y-1">
                            {conversations.map((conv) => (
                                <div key={conv.id} className="relative group">
                                    {editingId === conv.id ? (
                                        <div className="flex items-center gap-1 px-2 py-1.5">
                                            <input
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                className="flex-1 min-w-0 bg-gray-800 text-white text-sm rounded px-2 py-1 outline-none border border-blue-500"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleRename(conv.id);
                                                    if (e.key === "Escape") setEditingId(null);
                                                }}
                                                onClick={(e) => e.preventDefault()}
                                            />
                                            <button
                                                onClick={(e) => { e.preventDefault(); handleRename(conv.id); }}
                                                className="text-green-500 hover:text-green-400 p-1"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.preventDefault(); setEditingId(null); }}
                                                className="text-red-500 hover:text-red-400 p-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center">
                                            <Link
                                                href={`/chat/${conv.id}`}
                                                className={`flex-1 block px-2 py-1.5 text-sm rounded truncate transition-colors ${pathname === `/chat/${conv.id}`
                                                    ? "bg-white/5 text-orange-400 font-medium"
                                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                                    }`}
                                            >
                                                {conv.title || "New Chat"}
                                            </Link>

                                            {/* Menu Trigger - Only visible on hover or if menu is open */}
                                            <div className={`absolute right-1 top-1/2 -translate-y-1/2 ${menuOpenId === conv.id ? 'block' : 'hidden group-hover:block'}`}>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setMenuOpenId(menuOpenId === conv.id ? null : conv.id);
                                                    }}
                                                    className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                                                >
                                                    <MoreVertical className="w-3 h-3" />
                                                </button>

                                                {/* Dropdown Menu */}
                                                {menuOpenId === conv.id && (
                                                    <div
                                                        ref={menuRef}
                                                        className="absolute right-0 top-6 w-32 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50 py-1"
                                                    >
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); startEditing(conv.id, conv.title); }}
                                                            className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
                                                        >
                                                            <Edit2 className="w-3 h-3" />
                                                            Rename
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); handleDelete(conv.id); }}
                                                            className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-gray-700 hover:text-red-300 flex items-center gap-2"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {conversations.length === 0 && (
                                <p className="text-xs text-gray-600 px-2 italic">No conversations yet</p>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Sticky Bottom Section: Account & Settings + User Profile */}
            <div className="border-t border-white/5 bg-transparent">
                {/* Account & Settings */}
                <div className="px-3 py-2 space-y-1">
                    {accountItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex items-center gap-3 px-3 py-2 rounded-lg transition-all
                                    ${isActive
                                        ? "bg-white/5 text-orange-400 border-l-2 border-orange-500 rounded-l-none"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }
                                    ${collapsed ? "justify-center" : ""}
                                `}
                            >
                                <Icon className="w-5 h-5" />
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </div>

                {/* User Profile */}
                <div className="p-4 border-t border-white/5">
                    <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-black">
                            {user?.email?.[0].toUpperCase() || "U"}
                        </div>
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {user?.email?.split("@")[0]}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {firebaseUser?.isAnonymous ? "Guest User" : "Pro Plan"}
                                </p>
                            </div>
                        )}
                        {!collapsed && (
                            <button
                                onClick={handleSignOut}
                                className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>

    );
}
