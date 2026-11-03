"use client";

import {useState, useEffect} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { useApiFetch } from "@/hooks/useApiFetch";

interface LoginResponse {
    access_token: string;
    token_type: string; //bearer
    username: string;
    is_admin: boolean;
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

    function safeNext(next: string){
        const pathCheckReg = /^\/(?!\/)/;
        return pathCheckReg.test(next);
    }

    useEffect(() => {
        if (!ready) return;

        if(isLoggedIn) {
            
            if (safeNext(next)){
                router.replace(next);
            } else {
                router.replace("/");
            }
        };
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
            
            const loginResponse: LoginResponse = res;

            // context Login
            login(loginResponse.access_token, loginResponse.is_admin, loginResponse.username);
            
            if (safeNext(next)) {
                router.replace(next);
            } else {
                router.replace("/");
            }
        } catch(err: any) {
            setError(err.message ?? "Unknown Error");
            setLoading(false);
        }
    }

    return (
        <main className="mx-auto max-w-md px-6 py-16">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <header className="mb-6">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                        Login
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Sign in to manage your notes.
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                            <p className="text-sm text-red-600">
                                {error}
                            </p>
                        </div>
                        
                    )}

                    <div className="space-y-2">
                        <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                            Username
                        </label>

                        <input id="username"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2
                                        text-sm text-slate-900 outline-none transition
                                        placeholder:text-slate-400
                                        focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Password
                        </label>

                    <input
                        id="password"
                        type="password"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2
                                   text-sm text-slate-900 outline-none transition
                                   placeholder:text-slate-400
                                   focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full cursor-pointer rounded-lg bg-slate-900 px-4 py-2.5
                               text-sm font-medium text-white transition hover:bg-slate-700
                               disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "login..." : "login"}
                    </button>
                </form>
            </div>        
        </main>
    );
}

