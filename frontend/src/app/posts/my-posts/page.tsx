"use client";

import RequireAuth from "@/component/RequireAuth";
import { useApiFetch } from "@/hooks/useApiFetch";
import { useState, useEffect } from "react";
import Link from "next/link";

import type { ManagedPostOut } from "@/posts/schemas/post";

function MyPostsContent(){
    const api = useApiFetch();

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [posts, setPosts] = useState<ManagedPostOut[] | null>(null);

    useEffect(() => {
        async function getManagedPostOuts() {
            try {
                const managedPosts = await api<ManagedPostOut[]>("/api/v1/posts/manage", {cache:"no-store"});
                
                if (managedPosts === null) {
                     throw new Error("Managedposts response is empty");
                }

                setPosts(managedPosts);
            } catch(err: any) {
                // get the error msg from backend
                setError(err.message ?? "Unknown error");
            } finally {
                setLoading(false);
            }
        }

        getManagedPostOuts();
    }, [])

    if (loading) {
        return (
            <main className="p-8 max-w-lg">
                <p>Loading...</p>
            </main>
        );
    }
    if (error){
        return (
            <main className="p-8 max-w-lg">
                <p className="text-red-500 text-sm">Failed to load posts: {error}</p>
            </main>
        );
    }
    if (!posts) {
        return (            
            <main className="p-8 max-w-lg">
                <p className="text-red-500 text-sm">Page not found.</p>
            </main>            
        );
    }
    return (
        <main className="prose p-8">
            <ul className="space-y-3">
                {posts.map((post: ManagedPostOut) => { 
                    return (
                        <li key={post.id} className="border p-3 rounded hover:bg-gray-50 transition">
                            <Link href={`/posts/my-posts/${post.id}`} className="font-medium underline">
                                {post.title} <span>{post.is_published ? "Published" : "Draft"}</span>
                            </Link>
                            
                            {post.tags.length > 0 && (
                                <div className="flex gap-2 mt-2">
                                    {post.tags.map( (t:string) => (
                                        <p key = {t} 
                                        className="px-2 py-1 bg-gray-100 text-sm rounded hover:bg-gray-200"
                                        >
                                            {t}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </li>
                )})}
            </ul>
        </main>
    )
}

export default function Page(){
    return (
        <RequireAuth>
            <MyPostsContent></MyPostsContent>
        </RequireAuth>
    )
}
