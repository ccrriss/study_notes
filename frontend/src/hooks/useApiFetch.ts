"use client";

import { useAuth } from "@/context/AuthContext";
import { apiFetch, type ApiFetchOptions } from "@/lib/api";

export function useApiFetch(){
    const {token} = useAuth();

    return function <T = any>(path:string, options: ApiFetchOptions = {}) {
        return apiFetch<T>(path, {...options, token});
    }
}