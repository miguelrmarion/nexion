import AuthGate from "@/components/layout/auth-loading-gate";
import { AuthProvider } from "@/lib/providers/auth-provider";
import { cookies } from "next/headers";
import { ReactNode } from "react";

export default async function FeedLayout({
    children,
}: {
    children: ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || "";

    return (
        <AuthProvider token={token}>
            <AuthGate>{children}</AuthGate>
        </AuthProvider>
    );
}
