"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface WorkspaceContextType {
    currentWorkspaceId: string | null;
    setCurrentWorkspaceId: (id: string | null) => void;
    loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const { user, firebaseUser } = useAuth();
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && firebaseUser) {
            loadUserWorkspace();
        } else if (!loading && !user) { // Only clear if we are done loading auth and there is no user
            setCurrentWorkspaceId(null);
            setLoading(false);
        }
    }, [user, firebaseUser]);

    const loadUserWorkspace = async () => {
        try {
            setLoading(true);
            // Use firebaseUser to get the token, as user (AuthUser) doesn't have getIdToken
            const idToken = await firebaseUser?.getIdToken();

            // Fetch user's current workspace from their profile
            const response = await fetch(`/api/user/profile`, {
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentWorkspaceId(data.currentWorkspaceId || null);
            }
        } catch (error) {
            console.error("Error loading workspace:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <WorkspaceContext.Provider
            value={{
                currentWorkspaceId,
                setCurrentWorkspaceId,
                loading,
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error("useWorkspace must be used within a WorkspaceProvider");
    }
    return context;
}
