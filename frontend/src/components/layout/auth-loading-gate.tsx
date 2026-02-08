"use client";

import { useAuth } from "@/lib/providers/auth-provider";
import type { ReactNode } from "react";
import LoadingPage from "./loading-page";

export default function AuthGate({ children }: { children: ReactNode }) {
    const { isLoading } = useAuth();

    return isLoading ? <LoadingPage /> : children;
}
