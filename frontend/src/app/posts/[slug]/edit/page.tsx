"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import CancelButton from "@/component/CancelButton";

import RequireAuth from "@/component/RequireAuth";
import TagInput from "@/component/TagInput";
import MarkdownEditor from "@/component/MarkdownEditor";
import { useApiFetch } from "@/hooks/useApiFetch";

interface Post {
    id: number;
    slug: string;
    title: string;
    content_md: string;
    excerpt?: string | null;
    is_published: boolean;
    tags: string[];
}

export default function EditPostPage({params}: {params: Promise<{slug: string}>}){
    const router = useRouter();
    const {slug} = use(params);

    const [postId, setPostId] = useState<number | null>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tags, setTags] = useState<string[]>([]);

    // context hook
    const api = useApiFetch();

    useEffect(() =>{
        async function fetchPost(){
            try {
                
                const res = await api(`/api/v1/posts/${slug}`,
                    {
                        cache: "no-store"
                    }
                );
                const data: Post = res;
                setPostId(data.id);
                setTitle(data.title);
                setContent(data.content_md);
                setTags(data.tags);
            } catch(err: any) {
                setError(err.message ?? "Unknown error");
            } finally {
                setLoading(false);
            }
        }

        fetchPost();
    }, [slug]);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (postId == null) return;

        setSaving(true);
        setError(null);

        try {
            await api(`/api/v1/posts/${postId}`, {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    title, 
                    slug, // not updated yet
                    content_md: content,
                    excerpt: null,
                    is_published: true,
                    tags
                    }),
                 }
            );

            //更新成功后返回详情页
            router.push(`/posts/${slug}`);
        } catch(err: any){
            setError(err.message ?? "Unknown Error");
        } finally {
            setSaving(false);
        }
    }

    if(loading) {
        return (
            <RequireAuth>
                <main className="p-8 max-w-lg">
                    <p>Loading...</p>
                </main>
            </RequireAuth>
        );
    }

    if(error && postId === null){
        return (
            <RequireAuth>
                <main className="p-8 max-w-lg">
                    <p className="text-red-500 text-sm">Failed to load post: {error}</p>
                </main>
            </RequireAuth>
        );
    }

    return (
        <RequireAuth>
            <main className="p-8 max-w-6xl mx-auto space-y-4">
                <h1 className="text-2xl font-bold mb-4">Edit Post</h1>
                <form onSubmit={submit} className="space-y-3">
                    {error && (
                        <p className="text-sm text-red-500 border border-red-200 p-2 rounded">
                            {error}
                        </p>
                    )}
                    <input className="border w-full p-2 rounded" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)}></input>
                    <MarkdownEditor value={content} onChange={setContent} />
                    <TagInput value={tags} onChange={setTags}></TagInput>
                    <CancelButton saving={saving}></CancelButton>
                    <button className="px-4 py-2 rounded bg-black text-white disabled:opacity-60" disabled={saving}>
                        {saving? "Saving..." : "Save"}
                    </button>
                </form>
            </main>
        </RequireAuth>
    )
}

