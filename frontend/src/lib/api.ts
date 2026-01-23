export type ApiFetchOptions = RequestInit & { cache ?: string; token ?: string | null };

// clientside: vercel rewrite
// backend: BACKEND_URL
const API_BASE = (() => {
    const isServer = typeof window === "undefined";
    if (isServer) {
        return "";
    }
    // Server component
    const serverBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/,"");
    return serverBase;
})();


export async function apiFetch<T = any>(
    path:string,
    options: ApiFetchOptions = {}
): Promise<T | null> {
    if (!path.startsWith("/")) {
        path = "/" + path;
    }

    // 过滤next.js私有fetch字段
    const {cache, token, ...cleanOptions} = options;

    const headers : HeadersInit = {
        ...(cleanOptions.headers || {}),
        ...(token? {Authorization: `Bearer ${token}`}: {}),
    };

    const res = await fetch(`${API_BASE}${path}`, {
        ...cleanOptions,
        headers
    });

    if(!res.ok) {
        const res_body = await res.json().catch(() => ({}));
        throw new Error(`API Error ${res.status}, Detail: ${res_body.detail ?? "Unknown"}`);
    }

    // if 204 No Content, return null instead of res.json
    if (res.status === 204) {
        return null;
    }

    const data = (await res.json()) as T;
    return data;
}