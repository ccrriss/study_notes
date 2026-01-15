"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";

const TOKEN_KEY = 'access_token';

type AuthCtx = {
    token: string | null;
    ready: boolean;
    isLoggedIn: boolean;
    login: (token: string) => void;
    logout: () => void;
};

const AuthContext = createContext<AuthCtx | null>(null);

// 更稳的base64url decode(JWT就是base64url, 不是标准的base64)
function decodeJwtPayload(token: string) {
    const base64Url = token.split(".")[1];
    if(!base64Url) throw new Error("Invalid token");
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(base64 + pad);
    return JSON.parse(json);
}

function isTokenExpired(token: string | null): boolean {
    if(!token) return true;
    try {
        const payload = decodeJwtPayload(token);
        const expMs = payload.exp * 1000;
        return Date.now() >= expMs;
    } catch {
        return true;
    }
}

export function AuthProvider({children}: {children: React.ReactNode}) {
    const [token, setToken] = useState<string | null>(null);
    const [ready, setReady] = useState(false);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setReady(true);
    }, [])

    const login = useCallback((t:string) => {
        localStorage.setItem(TOKEN_KEY, t);
        setToken(t);
        setReady(true);
    }, []);

    // 从LocalStorage恢复，并做过期检查
    const syncFromStorage = useCallback(() => {
        const tk = localStorage.getItem(TOKEN_KEY);
        if(isTokenExpired(tk)) {
            localStorage.removeItem(TOKEN_KEY);
            setToken(null);
        } else {
            setToken(tk);
        }
        setReady(true);
    }, []);

    useEffect(() => {
        syncFromStorage();

        //多标签页同步
        const onStorage = (e: StorageEvent) => {
            if(e.key !== TOKEN_KEY) return;
            syncFromStorage();
        };
        window.addEventListener("storage", onStorage);

        // 可去掉，回到页面时再校验一次，避免放着过期
        const onFocus = () => syncFromStorage();
        window.addEventListener("focus", onFocus);

        return () => {
            window.removeEventListener("storage", onStorage);
            window.removeEventListener("focus", onFocus);
        };
    }, [syncFromStorage]);

    const value = useMemo<AuthCtx>(
        () => ({
            token,
            ready,
            isLoggedIn: !!token,
            login,
            logout,
        }),
        [token, ready, login, logout]
    );

    return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if(!ctx) throw new Error("useAuth must be used within <AuthProvider />");
    return ctx;
}