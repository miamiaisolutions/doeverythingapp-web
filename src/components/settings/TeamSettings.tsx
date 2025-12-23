"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Users, Mail, Plus, Trash2, Loader2, X } from "lucide-react";

interface Member {
    id: string;
    userId: string;
    role: string;
    invitedAt: string;
    joinedAt?: string;
    user: {
        email: string;
        name?: string;
        avatarUrl?: string;
    } | null;
}

interface Invite {
    id: string;
    email: string;
    role: string;
    invitedBy: string;
    createdAt: string;
    expiresAt: string;
}

export default function TeamSettings() {
    const { user, firebaseUser } = useAuth();
    const { currentWorkspaceId } = useWorkspace();
    const [members, setMembers] = useState<Member[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
    const [inviting, setInviting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

    useEffect(() => {
        if (user && currentWorkspaceId) {
            loadMembers();
        }
    }, [user, currentWorkspaceId]);

    const loadMembers = async () => {
        if (!currentWorkspaceId) return;

        try {
            setLoading(true);
            const idToken = await firebaseUser?.getIdToken();
            const response = await fetch(`/api/team/members?workspaceId=${currentWorkspaceId}`, {
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to load members");
            }

            const data = await response.json();
            setMembers(data.members || []);
            setInvites(data.invites || []);

            // Find current user's role
            const currentMember = data.members.find((m: Member) => m.userId === user?.uid);
            setCurrentUserRole(currentMember?.role || null);
        } catch (err) {
            console.error("Error loading members:", err);
            setError("Failed to load team members");
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail || !currentWorkspaceId) return;

        setInviting(true);
        setError(null);

        try {
            const idToken = await firebaseUser?.getIdToken();
            const response = await fetch("/api/team/invite", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    workspaceId: currentWorkspaceId,
                    email: inviteEmail,
                    role: inviteRole,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to send invitation");
            }

            // Reload members to show new invite
            await loadMembers();
            setShowInviteModal(false);
            setInviteEmail("");
            setInviteRole("member");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setInviting(false);
        }
    };

    const handleRemoveMember = async (memberUserId: string) => {
        if (!confirm("Are you sure you want to remove this member?") || !currentWorkspaceId) return;

        try {
            const idToken = await firebaseUser?.getIdToken();
            const response = await fetch("/api/team/remove-member", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    workspaceId: currentWorkspaceId,
                    memberUserId,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to remove member");
            }

            await loadMembers();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleChangeRole = async (memberUserId: string, newRole: "admin" | "member") => {
        if (!currentWorkspaceId) return;

        try {
            const idToken = await firebaseUser?.getIdToken();
            const response = await fetch("/api/team/update-role", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    workspaceId: currentWorkspaceId,
                    memberUserId,
                    newRole,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update role");
            }

            await loadMembers();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const canManageTeam = currentUserRole === "owner" || currentUserRole === "admin";

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "owner":
                return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
            case "admin":
                return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300";
            case "member":
                return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
            default:
                return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
        }
    };

    const getInitials = (name?: string, email?: string) => {
        if (name) {
            return name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
        }
        return email?.charAt(0).toUpperCase() || "?";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Team Members */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {members.length} member{members.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                    {canManageTeam && (
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Invite Member
                        </button>
                    )}
                </div>

                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-3 font-medium">User</th>
                                    <th className="px-4 py-3 font-medium">Role</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {members.map((member) => (
                                    <tr key={member.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {member.user?.avatarUrl ? (
                                                    <img
                                                        src={member.user.avatarUrl}
                                                        alt={member.user.name || member.user.email}
                                                        className="w-8 h-8 rounded-full"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-semibold text-xs">
                                                        {getInitials(member.user?.name, member.user?.email)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {member.user?.name || "Unknown"}
                                                        {member.userId === user?.uid && (
                                                            <span className="text-gray-500 dark:text-gray-400 ml-1">(You)</span>
                                                        )}
                                                    </p>
                                                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                                                        {member.user?.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {currentUserRole === "owner" && member.role !== "owner" ? (
                                                <select
                                                    value={member.role}
                                                    onChange={(e) =>
                                                        handleChangeRole(member.userId, e.target.value as "admin" | "member")
                                                    }
                                                    className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                                                >
                                                    <option value="admin">Admin</option>
                                                    <option value="member">Member</option>
                                                </select>
                                            ) : (
                                                <span className={`${getRoleBadgeColor(member.role)} px-2 py-1 rounded-full text-xs font-medium capitalize`}>
                                                    {member.role}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-green-600 dark:text-green-400 font-medium">Active</td>
                                        <td className="px-4 py-3 text-right">
                                            {member.role === "owner" ? (
                                                <span className="text-gray-400 italic text-xs">Cannot remove</span>
                                            ) : canManageTeam && member.userId !== user?.uid ? (
                                                <button
                                                    onClick={() => handleRemoveMember(member.userId)}
                                                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 rounded transition-colors"
                                                    title="Remove member"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Pending Invites */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                        <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Invites</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {invites.length} pending invitation{invites.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                {invites.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Mail className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-gray-900 dark:text-white font-medium">No pending invites</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            Invite team members to collaborate on webhooks.
                        </p>
                    </div>
                ) : (
                    <div className="p-6">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Email</th>
                                        <th className="px-4 py-3 font-medium">Role</th>
                                        <th className="px-4 py-3 font-medium">Sent</th>
                                        <th className="px-4 py-3 font-medium">Expires</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {invites.map((invite) => (
                                        <tr key={invite.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                                                {invite.email}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`${getRoleBadgeColor(invite.role)} px-2 py-1 rounded-full text-xs font-medium capitalize`}>
                                                    {invite.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                {new Date(invite.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                {new Date(invite.expiresAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Invite Team Member</h3>
                            <button
                                onClick={() => {
                                    setShowInviteModal(false);
                                    setInviteEmail("");
                                    setError(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleInvite} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="colleague@example.com"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                    <option value="member">Member - Can create own webhooks</option>
                                    <option value="admin">Admin - Can manage team and all webhooks</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowInviteModal(false);
                                        setInviteEmail("");
                                        setError(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviting}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {inviting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        "Send Invitation"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
