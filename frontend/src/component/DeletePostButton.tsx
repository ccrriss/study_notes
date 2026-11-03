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
        <div className="flex flex-col items-start gap-2">       
            <button onClick={handleDelete} disabled={loading} type="button"
                className="cursor-pointer rounded-lg border border-red-200 bg-red-50 px-4 py-2
                           text-sm font-medium text-red-600 transition hover:bg-red-100
                           disabled:cursor-not-allowed disabled:opacity-60">
                {loading? "Deleting..." : "Delete"}
            </button>

            {error && (
                <p className="text-sm text-red-600"> Failed to delete post: {error}</p>
            )}
        </div>
    )
}