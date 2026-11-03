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
        let ignore = false;

        async function getManagedPostOuts() {
            try {
                const managedPosts = await api<ManagedPostOut[]>("/api/v1/posts/manage", {cache:"no-store"});

                if (ignore) {
                    return;
                }
                
                if (managedPosts === null) {
                     throw new Error("Managedposts response is empty");
                }

                setPosts(managedPosts);
            } catch(err: any) {
                // get the error msg from backend
                if (!ignore) {
                    setError(err.message ?? "Unknown error");
                }
            } finally {
                if(!ignore) {
                    setLoading(false);
                }
            }
        }

        getManagedPostOuts();

        return () => {
            ignore = true;
        }
    }, [])

    if (loading) {
        return (
            <main className="mx-auto max-w-5xl px-6 py-10">
                <p className="text-sm text-slate-500">Loading posts...</p>
            </main>
        );
    }

    if (error){
        return (
            <main className="mx-auto max-w-5xl px-6 py-10">
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-600">
                        Failed to load posts: {error}
                    </p>
                </div>
            </main>
        );
    }
    
    if (!posts) {
        return (            
            <main className="mx-auto max-w-5xl px-6 py-10">
                <p className="text-sm text-slate-500">Page not found.</p>
            </main>      
        );
    }
    return (
        <main className="mx-auto max-w-5xl px-6 py-10">
            <header className="mb-8 ">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                        My Posts
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Manage your drafts and published notes.
                    </p>
                </div>
            </header>
            {posts.length === 0? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                    <h2 className="text-base font-medium text-slate-900">
                        No posts yet
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        Create your first post to get started.
                    </p>

                    <Link
                        href="/new"
                        className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                    >
                        Create Post
                    </Link>
                </div>
            ):(
                <ul className="space-y-4">
                    {posts.map((post: ManagedPostOut) => { 
                        return (
                            <li key={post.id} 
                                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 
                            hover:shadow">

                                 <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <Link href={`/posts/my-posts/${post.id}`}
                                            className="text-lg font-semibold text-slate-900 transition hover:text-slate-600">
                                            {post.title} 
                                        </Link>

                                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                                            <span>Owner: {post.username}</span>

                                            <span aria-hidden="true">·</span>

                                            <span>
                                                Updated: {new Date(post.updated_at).toLocaleString()}
                                            </span>

                                        </div>
                                    </div>

                                    <span className={
                                        post.is_published
                                            ? "shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                                            : "shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
                                    }>
                                        {post.is_published ? "Published" : "Draft"}
                                    </span>
                                </div>
                                
                                {post.tags.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {post.tags.map( (tag:string) => (
                                            <span key = {tag} 
                                                className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </li>
                    )})}
                </ul>
            )}          
        </main>
    );
}

export default function Page(){
    return (
        <RequireAuth>
            <MyPostsContent></MyPostsContent>
        </RequireAuth>
    )
}
