"use client";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useFilePreview } from "@/hooks/use-file-preview";
import { registerUser } from "@/lib/api/auth";
import { updateCurrentUser } from "@/lib/api/user";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface FormFieldProps {
    label: string;
    id: string;
    children: React.ReactNode;
}

function FormField({ label, id, children }: FormFieldProps) {
    return (
        <div>
            <label
                htmlFor={id}
                className="block text-sm font-medium mb-1 text-slate-700"
            >
                {label}
            </label>
            {children}
        </div>
    );
}

interface ProfilePictureFieldProps {
    preview: string | null;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
function ProfilePictureField({
    preview,
    onFileChange,
}: ProfilePictureFieldProps) {
    return (
        <FormField label="Profile picture (optional)" id="profilePicture">
            <Input
                id="profilePicture"
                type="file"
                accept="image/*"
                onChange={onFileChange}
            />
            {preview && (
                <div className="mt-2 flex justify-center">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-16 h-16 rounded-full object-cover border-2 border-border ring-2 ring-primary/20"
                    />
                </div>
            )}
        </FormField>
    );
}

function ErrorAlert({ message }: { message: string }) {
    if (!message) return null;

    return (
        <div className="bg-danger/10 text-danger p-3 rounded-lg mb-4 text-sm">
            {message}
        </div>
    );
}

export default function Register() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const {
        file: profilePicture,
        preview: profilePicturePreview,
        handleFileChange: handleProfilePictureChange,
    } = useFilePreview();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email.trim() || !password.trim() || !username.trim()) {
            setError("Fill in all fields");
            return;
        }
        if (username.length < 3) {
            setError("Username must be at least 3 characters");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);

        try {
            const registerResponse = await registerUser(
                username,
                email,
                password,
            );

            if (!registerResponse.ok) {
                const errorData = await registerResponse.json();

                if (errorData.message) setError(errorData.message);
                else setError("Registration error. Please try again.");
                setIsLoading(false);
                return;
            }

            if (profilePicture)
                try {
                    await updateCurrentUser(undefined, profilePicture);
                } catch (error) {}

            router.push("/auth/login");
        } catch (error) {
            setError("Connection error. Check your internet and try again.");
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-nav-from via-primary to-accent">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-[fadeIn_0.3s_ease-out]">
                <div className="flex justify-center mb-6">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Nexion
                    </h1>
                </div>

                <h2 className="text-xl font-semibold text-center mb-6 text-slate-700">
                    Create your account
                </h2>

                <ErrorAlert message={error} />

                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField label="Username" id="username">
                        <Input
                            id="username"
                            type="text"
                            minLength={3}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                        />
                    </FormField>

                    <FormField label="Email" id="email">
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                        />
                    </FormField>

                    <FormField label="Password" id="password">
                        <Input
                            id="password"
                            type="password"
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                        />
                    </FormField>

                    <FormField
                        label="Confirm your password"
                        id="confirmPassword"
                    >
                        <Input
                            id="confirmPassword"
                            type="password"
                            minLength={6}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Enter your password again"
                        />
                    </FormField>

                    <ProfilePictureField
                        preview={profilePicturePreview}
                        onFileChange={handleProfilePictureChange}
                    />

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full"
                    >
                        {isLoading ? "Registering..." : "Register"}
                    </Button>
                </form>

                <div className="mt-4 text-center">
                    <Link
                        href="/auth/login"
                        className="text-sm text-primary hover:text-accent transition-colors hover:underline"
                    >
                        Already have an account? Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
