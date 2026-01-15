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
        <form onSubmit={submit} className="mb-4 flex gap-2">
            <input 
                className="border p-2 flex-1 rounded"
                placeholder="Search title..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
            <button className="px-4 py-2 bg-black text-white rounded">Search</button>
        </form>
    )
}