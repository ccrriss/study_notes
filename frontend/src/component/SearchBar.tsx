"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar({q, tag} : {q: string | null, tag: string | null}){
    const router = useRouter();
    const [value, setValue] = useState(q || "");

    function submit(e: React.FormEvent) {
        e. preventDefault();

        const params = new URLSearchParams();
        if(value.trim() !== ""){
            params.set("q", value.trim());
        }
        
        if(tag) {
            params.set("tag", tag)
        }

        params.set("page", "1"); //搜索时回到第一页

        router.push("/posts?" + params.toString());
    }

    return (
        <form onSubmit={submit} className="flex gap-3">
            <input 
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5
                       text-sm text-slate-900 outline-none transition
                       placeholder:text-slate-400
                       focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                placeholder="Search notes by title..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
            <button type="submit"
                className="cursor-pointer rounded-lg bg-slate-900 px-5 py-2.5
                       text-sm font-medium text-white transition hover:bg-slate-700">
                Search
            </button>
        </form>
    )
}