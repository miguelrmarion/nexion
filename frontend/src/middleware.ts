import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { refreshToken, verifyToken } from "./lib/api/auth";

const PROTECTED_PATHS = [] as string[];
const AUTH_PATHS = ["/auth/login", "/auth/register"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Redirect / to /feed
    if (pathname === "/")
        return NextResponse.redirect(new URL("/feed", request.url));

    const isProtectedRoute = PROTECTED_PATHS.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`),
    );
    const isAuthRoute = AUTH_PATHS.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`),
    );

    const isValidToken = await checkIsTokenValid(request);
    if (isProtectedRoute) {
        if (!isValidToken) return await tryRefreshToken(request);
        return NextResponse.next();
    }

    if (isAuthRoute && isValidToken)
        return NextResponse.redirect(new URL("/feed", request.url));

    return NextResponse.next();
}

const redirectToLogin = (request: NextRequest) => {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("returnUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
};

const checkIsTokenValid = async (request: NextRequest): Promise<boolean> => {
    if (!request.cookies.has("auth_token")) return false;

    return await verifyToken(request.cookies.get("auth_token")!.value).then(
        (response) => response.ok,
    );
};

async function tryRefreshToken(
    request: NextRequest,
): Promise<NextResponse | undefined> {
    const tokenCookie = request.cookies.get("auth_token")?.value;
    if (!tokenCookie) return redirectToLogin(request);

    const refreshResponse = await refreshToken();
    if (refreshResponse.ok) return NextResponse.next();

    return redirectToLogin(request);
}

export const config = {
    matcher: ["/", "/auth/login", "/auth/register"],
};
