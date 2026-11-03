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
        // added clean up to avoid setup useEffect twice
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
            <main className="p-8 max-w-lg">
                <p>Loading...</p>
            </main>
        );
    }

    if (error){
        return (
            <main className="p-8 max-w-lg">
                <p className="text-red-500 text-sm">Failed to load post: {error}</p>
            </main>
        );
    }

    if (!post) {
        return (
            <main className="p-8 max-w-lg">
                <p className="text-red-500 text-sm">Page not found.</p>
            </main>
        );
    }

    return (
        <main className="prose p-8">
            <div className="flex items-center justify-between mb-4">
                <h1>{post.title} <span>{post.is_published ? "Published" : "Draft"}</span></h1>
                {post.tags.length > 0 && (
                    <div className="flex gap-2 mb-4">
                        {post.tags.map((t:string) => (
                            <p key={t} 
                                className="px-2 py-1 text-sm bg-gray-200 rounded"
                            >
                                {t}
                            </p>
                        ))}
                    </div>
                )}
                <div className="flex gap-2">
                    <Link href={`/posts/my-posts`} className="px-3 py-1 rounded border text-sm">
                        Back
                    </Link>
                    
                    <PostActions slug={post.slug} id={post.id}></PostActions>
                    
                </div>
            </div>
            <Markdown md={post.content_md}></Markdown>
        </main>
    )
}

export default function Page({params}: {params: Promise<{postId: string}>}) {
    const {postId} = use(params);
  
    return (
        <RequireAuth>
            <MyPostContent postId={postId}></MyPostContent>
        </RequireAuth>
    )

} 