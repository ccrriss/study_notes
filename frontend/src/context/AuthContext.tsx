"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";

const TOKEN_KEY = 'access_token';
const IS_ADMIN_KEY = 'is_admin';
const USERNAME_KEY = 'username';

type AuthCtx = {
    token: string | null;
    ready: boolean;
    isLoggedIn: boolean;
    login: (token: string, is_admin: boolean, username: string) => void;
    logout: () => void;
    isAdmin: boolean;
    username: string | null;
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
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [username, setUsername] = useState<string | null>(null);

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(IS_ADMIN_KEY);
        localStorage.removeItem(USERNAME_KEY);
        setToken(null);
        setReady(true);
        setIsAdmin(false);
        setUsername(null);
    }, [])

    const login = useCallback((t:string, is_admin: boolean, username: string) => {
        localStorage.setItem(TOKEN_KEY, t);
        localStorage.setItem(IS_ADMIN_KEY, String(is_admin));
        localStorage.setItem(USERNAME_KEY, username);
        setToken(t);
        setReady(true);
        setIsAdmin(is_admin);
        setUsername(username);
    }, []);

    // 从LocalStorage恢复，并做过期检查
    const syncFromStorage = useCallback(() => {
        const tk = localStorage.getItem(TOKEN_KEY);
        const storedAdmin = localStorage.getItem(IS_ADMIN_KEY);
        const is_admin = storedAdmin === "true";
        const storedUsername = localStorage.getItem(USERNAME_KEY);
        if(isTokenExpired(tk)) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(IS_ADMIN_KEY);
            localStorage.removeItem(USERNAME_KEY);
            setToken(null);
            setIsAdmin(false);
            setUsername(null);
        } else {
            setToken(tk);
            setIsAdmin(is_admin);
            setUsername(storedUsername);
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
            isAdmin,
            username,
        }),
        [token, ready, login, logout, isAdmin, username]
    );

    return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if(!ctx) throw new Error("useAuth must be used within <AuthProvider />");
    return ctx;
}