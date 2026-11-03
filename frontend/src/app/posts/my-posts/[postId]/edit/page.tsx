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
        setError(null);

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

            router.replace(`/posts/my-posts/${postId}`)
        } catch(err: any){
            setError(err.message ?? "Unknown Error");
            setSaving(false);
        }
    }

    useEffect(() => {
        let ignore = false;

        async function getManagedPostOut(postId: string) {
            try {
                const managedPost = await api<ManagedPostOut|null>(`/api/v1/posts/manage/${postId}`, {cache:"no-store"});
                
                if(ignore) {
                    return;
                }

                if (managedPost === null) {
                    throw new Error("Managed post response is empty");
                }

                setPost(managedPost);
            } catch(err: any) {
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
                <p className="text-sm text-slate-500">Loading post...</p>
            </main>
        );
    }

    if (error && !post){
        return (
            <main className="mx-auto max-w-5xl px-6 py-10">
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-600">
                        Failed to load post: {error}
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
        <main className="mx-auto max-w-4xl px-6 py-10">
            <header className="mb-8">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                    Edit Post
                </h1> 

                <p className="mt-2 text-sm text-slate-500">
                    Update the content, tags, and publication status of this post.
                </p>
            </header>
            <form onSubmit={submit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                        <p className="text-sm text-red-600">
                            {error}
                        </p>
                    </div>
                )}
                
                <div className="space-y-2">
                    <label htmlFor="title"
                        className="block text-sm font-medium text-slate-700"
                    >
                        Title
                    </label>

                    <input id="title" 
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2
                                   text-slate-900 outline-none transition
                                   placeholder:text-slate-400
                                   focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                        placeholder="Enter post title" value={post.title} 
                        onChange={e=>setPost({...post, title: e.target.value})} required
                    />
                </div>

                <div className="space-y-2">
                    <span className="block text-sm font-medium text-slate-700">
                        Status
                    </span>

                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" checked={post.is_published} onChange={e => {
                            setPost({...post, is_published: e.target.checked})}}
                        className="h-4 w-4"/>

                        Published
                    </label>

                    <p className="text-xs text-slate-400">
                        Uncheck this to keep the post as a draft.
                    </p>
                </div>
                
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                        Content
                    </label>
                    
                    <MarkdownEditor value={post.content_md} onChange={(content:string) => {
                        setPost({...post, content_md: content});
                    }} />
                </div>
                
                <div className="space-y-2">
                    <TagInput value={post.tags} onChange={(tags: string[]) => {
                            setPost({...post, tags: tags})
                    }}></TagInput>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                    <CancelButton saving={saving} destination={`/posts/my-posts/${postId}`}></CancelButton>
                    
                    <button type="submit"  
                        className="cursor-pointer rounded-lg bg-slate-900 px-4 py-2
                                   text-sm font-medium text-white transition hover:bg-slate-700
                                   disabled:cursor-not-allowed disabled:opacity-60" disabled={saving}
                    >
                        {saving? "Saving..." : "Save"}
                    </button>
                </div>
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