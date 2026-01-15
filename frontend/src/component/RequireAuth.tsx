"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function RequireAuth({children}: {children: React.ReactNode}){
    const {isLoggedIn, ready} = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if(!ready) return;

        if(!isLoggedIn) {
            // 携带next参数，登录成功后跳回
            const next = encodeURIComponent(pathname);
            router.replace(`/login?next=${next}`);
        }
    }, [ready, isLoggedIn, pathname, router]);

    // rendering时占位
    if(!ready) {
        return (
            <main className="p-8">
                <p>Checking auth...</p>
            </main>
        );
    }

    // useAuth的useEffect触发第二次渲染时
    if(!isLoggedIn) {
        return null;
    }

    // 已登录，正常渲染子内容
    return (
        <>{children}</>
    )
}