"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { User, Camera, Loader2, Save, Check, ShieldAlert } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";

export default function ProfileSettings() {
    const { user, firebaseUser } = useAuth();
    const [displayName, setDisplayName] = useState("");
    const [photoURL, setPhotoURL] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            // Prefer Firestore profile, fallback to Auth profile
            setDisplayName(user.name || firebaseUser?.displayName || "");
            setPhotoURL(user.avatarUrl || firebaseUser?.photoURL || "");
        }
    }, [user, firebaseUser]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user || !firebaseUser) return;

        // Validation
        if (!file.type.startsWith("image/")) {
            setMessage({ type: 'error', text: "Please upload an image file." });
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB
            setMessage({ type: 'error', text: "Image size must be less than 5MB." });
            return;
        }

        setIsUploading(true);
        setMessage(null);

        try {
            const storageRef = ref(storage, `avatars/${user.uid}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // Update Auth Profile
            await updateProfile(firebaseUser, { photoURL: downloadURL });

            // Update Firestore User Doc
            await updateDoc(doc(db, "users", user.uid), { avatarUrl: downloadURL });

            setPhotoURL(downloadURL);
            setMessage({ type: 'success', text: "Avatar updated successfully!" });
        } catch (error) {
            console.error("Error uploading avatar:", error);
            setMessage({ type: 'error', text: "Failed to upload avatar." });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !firebaseUser) return;

        setIsSaving(true);
        setMessage(null);

        try {
            // Update Auth Profile
            await updateProfile(firebaseUser, { displayName: displayName.trim() });

            // Update Firestore User Doc
            await updateDoc(doc(db, "users", user.uid), { name: displayName.trim() });

            setMessage({ type: 'success', text: "Profile updated successfully!" });
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage({ type: 'error', text: "Failed to update profile." });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Details</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your public profile information.</p>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Avatar Upload */}
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                                {photoURL ? (
                                    <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-10 h-10 text-gray-400" />
                                )}
                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">Profile Picture</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Upload a new avatar. Max size 5MB.
                            </p>
                        </div>
                    </div>

                    {/* Profile Form */}
                    <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your Name"
                                className="w-full px-4 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={user?.email || ""}
                                disabled
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed.</p>
                        </div>

                        {message && (
                            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {message.type === 'success' ? <Check className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                {message.text}
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSaving || !displayName.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 disabled:opacity-50 font-medium"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
