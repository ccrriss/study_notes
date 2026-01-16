"use client";

import {useState, useEffect} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { useApiFetch } from "@/hooks/useApiFetch";

interface LoginResponse {
    access_token: string;
    token_type: string; //bearer
}

export default function LoginPage(){
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get("next") || "/";

    const {ready, isLoggedIn, login} = useAuth();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // context hook
    const api = useApiFetch();

     // 可选：如果已经有 token，直接跳转到 /posts
    useEffect(() => {
        if (!ready) return;
        if(isLoggedIn) router.replace(next);
    }, [ready, isLoggedIn, router, next]);

    async function handleSubmit(e:React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            

            const res = await api("/api/v1/auth/login", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({username, password})
            });
            
            const data: LoginResponse = res;

            // context Login
            login(data.access_token);
            // login success, push to list page/or previous page
            router.push(next);
        } catch(err: any) {
            setError(err.message ?? "Unknown Error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="max-w-md mx-auto p-8 space-y-4">
            <h1 className="text-2xl font-bold">Login</h1>

            <form onSubmit={handleSubmit} className="space-y-3">
                {error && (
                    <p className="text-sm text-red-500 border border-red-200 p-2 rounded">
                        {error}
                    </p>
                )}

                <div className="space-y-1">
                <label className="block text-sm font-medium">Username</label>
                <input
                    className="border w-full p-2 rounded text-sm"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                />
                </div>

                <div className="space-y-1">
                <label className="block text-sm font-medium">Password</label>
                <input
                    type="password"
                    className="border w-full p-2 rounded text-sm"
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                />
                </div>

                <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded bg-black text-white text-sm disabled:opacity-60"
                >
                {loading ? "login..." : "login"}
                </button>
            </form>
        </main>
    )
}

