"use client";
import { useFilePreview } from "@/hooks/use-file-preview";
import { getCurrentUser, updateCurrentUser, User } from "@/lib/api/user";
import { useAuth } from "@/lib/providers/auth-provider";
import { FormEvent, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useSWRConfig } from "swr";
import Button from "../ui/button";
import Input from "../ui/input";
import Overlay from "./overlay";

interface ProfilePictureSectionProps {
    preview: string | null;
    name: string;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
function ProfilePictureSection({
    preview,
    name,
    onFileChange,
}: ProfilePictureSectionProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
                {preview ? (
                    <img
                        src={preview}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-border ring-2 ring-primary/20"
                    />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center border-4 border-white">
                        <span className="text-2xl text-white font-medium">
                            {name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}
            </div>
            <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
            >
                Change Photo
            </Button>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
            />
        </div>
    );
}

interface UserConfigOverlayProps {
    close: () => void;
}

export default function UserConfigOverlay({ close }: UserConfigOverlayProps) {
    const [user, setUser] = useState<User | null>(null);
    const [name, setName] = useState("");
    const {
        file: profilePicture,
        preview: profilePicturePreview,
        handleFileChange,
        setPreview: setProfilePicturePreview,
    } = useFilePreview();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { mutate } = useSWRConfig();
    const { refetchUser } = useAuth();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await getCurrentUser();

                setUser(userData);
                setName(userData.name);
                if (userData.profilePicture)
                    setProfilePicturePreview(userData.profilePicture);
            } catch (error) {
                toast.error("Error loading user data");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const updatedUser = await updateCurrentUser(
                name !== user?.name ? name : undefined,
                profilePicture || undefined,
            );

            setUser(updatedUser);

            await Promise.all([
                refetchUser(),
                mutate("/posts"),
                mutate("/communities"),
                mutate(
                    (key) => typeof key === "string" && key.includes("/posts/"),
                ),
                mutate(
                    (key) =>
                        typeof key === "string" &&
                        key.includes("/communities/"),
                ),
            ]);

            toast.success("Profile updated successfully!");
            close();
        } catch (error) {
            toast.error("Error updating profile");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Overlay
                className="w-[60vh] max-h-[85vh]"
                onClose={close}
                title="User Settings"
            >
                <div className="flex items-center justify-center py-20">
                    <div className="text-muted">Loading...</div>
                </div>
            </Overlay>
        );
    }

    return (
        <Overlay
            className="w-[60vh] max-h-[85vh]"
            onClose={close}
            title="User Settings"
        >
            <div className="flex flex-col">
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col space-y-6"
                >
                    <ProfilePictureSection
                        preview={profilePicturePreview}
                        name={name}
                        onFileChange={handleFileChange}
                    />

                    <div className="mb-6">
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-slate-700 mb-2"
                        >
                            Username
                        </label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-slate-700 mb-2"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={user?.email || ""}
                            disabled
                            className="w-full p-3 border border-border rounded-lg bg-surface text-muted"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={close}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </div>
        </Overlay>
    );
}
