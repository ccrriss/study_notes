"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useApiFetch } from "@/hooks/useApiFetch";

export default function DeletePostButton({id}: {id:number}){
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // use context hook
    const api = useApiFetch();
    
    async function handleDelete() {
        if(!confirm("Are you sure you want to delete this post?")) return;

        setLoading(true);
        try {
            await api(`/api/v1/posts/${id}`,{
                method:"DELETE",
            });

            // delete success and back to list page
            router.push("/posts");
        } finally {
            setLoading(false);
        }
    }

    return (
        <button onClick={handleDelete} disabled={loading} className="px-3 py-1 rounded border border-red-500 text-red-600 text-sm disabled:opacity-60">
            {loading? "Deleting..." : "Delete"}
        </button>
    )
}