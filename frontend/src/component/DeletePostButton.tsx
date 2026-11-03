"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useApiFetch } from "@/hooks/useApiFetch";

export default function DeletePostButton({id}: {id:number}){
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // use context hook
    const api = useApiFetch();
    
    async function handleDelete() {
        if(!confirm("Are you sure you want to delete this post?")) return;

        setLoading(true);
        setError(null);

        try {
            await api(`/api/v1/posts/${id}`,{
                method:"DELETE",
            });

            // delete success and back to list page
            router.replace("/posts/my-posts");
        } catch(err: any) {
            setError(err.message ?? "Unknown error");
            setLoading(false);
        }
    }

    return (
        <>  
            {error && (
                <p>Error is: {error}</p>
            )}
            <button onClick={handleDelete} disabled={loading} className="px-3 py-1 rounded border border-red-500 text-red-600 text-sm
                disabled:opacity-60">
                {loading? "Deleting..." : "Delete"}
            </button>
        </>

        
    )
}