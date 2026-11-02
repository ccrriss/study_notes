"use client";

import type { ManagedPostOut } from "@/posts/schemas/post";
import RequireAuth from "@/component/RequireAuth";
import { useApiFetch } from "@/hooks/useApiFetch";
import { use, useEffect, useState } from "react";
import MarkdownEditor from "@/component/MarkdownEditor";
import TagInput from "@/component/TagInput";
import CancelButton from "@/component/CancelButton";
import { useRouter } from "next/navigation";

function EditMyPost(props: {postId: string}){
    const {postId} = props;
    const api = useApiFetch();
    const router = useRouter();

    const [post, setPost] = useState<ManagedPostOut | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const [saving, setSaving] = useState<boolean>(false);

    async function submit(e:React.FormEvent) {
        e.preventDefault();

        if (!post) {
            return;
        }

        setSaving(true);

        try {
            await api(`/api/v1/posts/${postId}`, {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    title: post.title,
                    slug: post.slug,
                    content_md: post.content_md,
                    excerpt: post.excerpt,
                    is_published: post.is_published,
                    tags: post.tags
                }),
            });

            router.push(`/posts/my-posts/${postId}`)
        } catch(err: any){
            setError(err.message ?? "Unknown Error");
        } finally {
            setSaving(false);
        }
    }

    useEffect(() => {
        async function getManagedPostOut(postId: string) {
            try {
                const managedPost = await api<ManagedPostOut|null>(`/api/v1/posts/manage/${postId}`, {cache:"no-store"});

                if (managedPost === null) {
                    throw new Error("Managed post response is empty");
                }

                setPost(managedPost);
            } catch(err: any) {
                setError(err.message ?? "Unknown error");
            } finally {
                setLoading(false);
            }
        }
        
        getManagedPostOut(postId);

    }, [postId])

    if (loading) {
        return (
            <main className="p-8 max-w-lg">
                <p>Loading...</p>
            </main>
        );
    }

    if (error && !post){
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
        <main className="p-8 max-w-6xl mx-auto space-y-4">
            <h1 className="text-2xl font-bold mb-4">Edit Post</h1>
            <form onSubmit={submit} className="space-y-3">
                {error && (
                    <p className="text-sm text-red-500 border border-red-200 p-2 rounded">
                        {error}
                    </p>
                )}
                
                <input className="border w-full p-2 rounded" placeholder="Title" value={post.title} 
                    onChange={e=>setPost({...post, title: e.target.value})}></input>
                
                <label>
                    <input type="checkbox" checked={post.is_published} onChange={e => {
                        setPost({...post, is_published: e.target.checked})
                    }}/>
                    Published
                </label>

                <MarkdownEditor value={post.content_md} onChange={(content:string) => {
                        setPost({...post, content_md: content});
                }} />
                <TagInput value={post.tags} onChange={(tags: string[]) => {
                        setPost({...post, tags: tags})
                }}></TagInput>
                <CancelButton saving={saving}></CancelButton>
                <button className="px-4 py-2 rounded bg-black text-white disabled:opacity-60" disabled={saving}>
                    {saving? "Saving..." : "Save"}
                </button>
            </form>
        </main>
    )
}

export default function Page({params}: {params: Promise<{postId: string}>}) {
    const {postId} = use(params);

    return (
        <RequireAuth>
            <EditMyPost postId={postId}></EditMyPost>
        </RequireAuth>
    )
}