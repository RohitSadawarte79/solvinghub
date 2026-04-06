"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken } from "@/lib/api";

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // First try to get token from URL query parameter (sent by backend after OAuth)

        const tokenFromQuery = searchParams.get("token");

        if (tokenFromQuery) {
            setToken(tokenFromQuery);
            // Clean up URL by removing the token parameter
            const cleanUrl = window.location.pathname;
            window.history.replaceState(null, "", cleanUrl);
        }

        // Once the token is captured, immediately redirect to homepage
        // We use window.location here to ensure a full page reload so state resets
        window.location.href = "/";
    }, [router, searchParams]);

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground animate-pulse">Signing you in...</p>
            </div>
        </div>
    );
}

export default function AuthCallback() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center">
                <div className="flex flex-col items-center justify-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground animate-pulse">Signing you in...</p>
                </div>
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}
