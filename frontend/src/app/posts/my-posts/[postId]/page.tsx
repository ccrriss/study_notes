"use client";

import RequireAuth from "@/component/RequireAuth";
import { useApiFetch } from "@/hooks/useApiFetch";
import PostActions from "@/component/PostActions";
import Link from "next/link";
import Markdown from "@/component/MarkdownClient";
import { use, useEffect, useState } from "react";

import type { ManagedPostOut } from "@/posts/schemas/post";

function MyPostContent(props: {postId:string}){
    const api = useApiFetch();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const {postId} = props;

    const [post, setPost] = useState<ManagedPostOut | null>(null);

    useEffect(() => {
        // Ignore stale async results after effect cleanup
        let ignore = false;

        async function getManagedPostOut(postId: string) {
            try {
                // in theory, only delete res will return null from api()
                const managedPostOut: ManagedPostOut | null = await api<ManagedPostOut>(`/api/v1/posts/manage/${postId}`, {cache:"no-store"});
                
                if (ignore) {
                    return;
                }

                if (managedPostOut === null) {
                    throw new Error("Managed post response is empty");
                }

                setPost(managedPostOut);

            } catch(err: any) {
                // get the error msg from backend
                if(!ignore) {
                    setError(err.message ?? "Unknown error");
                }
            } finally {
                if(!ignore) {
                    setLoading(false);
                }
            }
        }

        getManagedPostOut(postId);

        return () => {
            ignore = true;
        }
    }, [postId])

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

    if (!post) {
        return (            
            <main className="mx-auto max-w-5xl px-6 py-10">
                <p className="text-sm text-slate-500">Page not found.</p>
            </main>      
        );
    }

    return (
        <main className="mx-auto max-w-5xl px-6 py-10">
            <div className="mb-6">
                <Link
                    href="/posts/my-posts"
                    className="text-sm text-slate-500 transition hover:text-slate-900"
                >
                    ← Back to My Posts
                </Link>
            </div>

            <header className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                        {post.title}
                    </h1>

                    <span
                        className={
                            post.is_published
                                ? "shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                                : "shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
                        }
                    >
                        {post.is_published ? "Published" : "Draft"}
                    </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                    <span>Owner: {post.username}</span>

                    <span aria-hidden="true">·</span>

                    <span>
                        Created: {new Date(post.created_at).toLocaleString()}
                    </span>

                    <span aria-hidden="true">·</span>

                    <span>
                        Updated: {new Date(post.updated_at).toLocaleString()}
                    </span>
                </div>

                {post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {post.tags.map((tag:string) => (
                            <span key={tag} 
                                className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
                    {post.is_published && (
                        <Link
                            href={`/posts/${post.slug}`}
                             className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium 
                             text-slate-700 transition hover:bg-slate-50"
                        >
                            View Public Post
                        </Link>
                    )}

                    <PostActions id={post.id}></PostActions>
                </div>
            </header>

            <article className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                <Markdown md={post.content_md}></Markdown>
            </article>  
        </main>
    );
}

export default function Page({params}: {params: Promise<{postId: string}>}) {
    const {postId} = use(params);
  
    return (
        <RequireAuth>
            <MyPostContent postId={postId}></MyPostContent>
        </RequireAuth>
    )

} 