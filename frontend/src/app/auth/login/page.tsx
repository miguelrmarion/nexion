"use client";

import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { loginUser } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        if (!username.trim() || !password.trim()) {
            setError("Username or password not filled in");
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

        setIsLoading(true);

        const loginResponse = await loginUser(username, password);

        if (loginResponse.ok) {
            const currentUrl = new URL(window.location.href);
            router.push(currentUrl.searchParams.get("returnUrl") ?? "/");
        } else if (loginResponse.status === 404)
            setError("Incorrect username or password.");
        else setError("Login error. Please try again later.");

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
                    Sign in to your account
                </h2>

                {error && (
                    <div className="bg-danger/10 text-danger p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="username"
                            className="block text-sm font-medium mb-1 text-slate-700"
                        >
                            Username
                        </label>
                        <Input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            data-testid="username-input"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium mb-1 text-slate-700"
                        >
                            Password
                        </label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            data-testid="password-input"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full"
                        data-testid="login-button"
                    >
                        {isLoading ? "Signing in..." : "Sign in"}
                    </Button>
                </form>

                <div className="mt-4 text-center">
                    <a
                        href="/auth/register"
                        className="text-sm text-primary hover:text-accent transition-colors hover:underline"
                    >
                        Create account
                    </a>
                </div>
            </div>
        </div>
    );
}
