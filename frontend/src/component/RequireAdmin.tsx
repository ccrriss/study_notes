"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function RequireAdmin({children}: {children:React.ReactNode}) {
    const {ready, isLoggedIn, isAdmin} = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!ready) return;

        if (!isLoggedIn) {
            const next = encodeURIComponent(pathname);
            router.replace(`/login?next=${next}`);
            return;
        }

        if (!isAdmin) {
            router.replace(`/rag`);
            return;
        }

    }, [ready, isLoggedIn, pathname, router, isAdmin]);

    if (!ready) {
        return (
            <main className="p-8">
                <p>Checking auth...</p>
            </main>
        );
    }

    if (!isLoggedIn || !isAdmin) {
        return null;
    }

    return (
        <>{children}</>
    )
}