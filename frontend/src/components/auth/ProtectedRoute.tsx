"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUserFromToken } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { toast } from "@/lib/toast-wrapper";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            const user = getUserFromToken();
            if (!user) {
                toast({
                    title: "Authentication Required",
                    description: "Please log in to access this page.",
                    variant: "destructive",
                });
                // Encode the current pathname to redirect back after login
                router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
            } else {
                setIsAuthenticated(true);
            }
            setIsChecking(false);
        };

        // Small timeout to ensure localStorage/cookies are mounted if hydrations differ
        const timer = setTimeout(checkAuth, 50);
        return () => clearTimeout(timer);
    }, [router, pathname]);

    if (isChecking) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect in useEffect
    }

    return <>{children}</>;
}
