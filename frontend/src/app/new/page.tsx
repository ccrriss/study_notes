"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import RequireAuth from "@/component/RequireAuth";
import TagInput from "@/component/TagInput";
import MarkdownEditor from "@/component/MarkdownEditor";
import { useApiFetch } from "@/hooks/useApiFetch";


export default function NewPost(){
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [is_published, setIs_published] = useState<boolean>(true); 

    // context hook
    const api = useApiFetch();

    async function submit(e: React.FormEvent) {
        e.preventDefault();

        setSaving(true);
        setError(null);

        try {
            
            await api("/api/v1/posts", 
                {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        title, 
                        content_md: content,
                        tags,
                        is_published,
                    }),
                }
            );

            router.replace("/posts/my-posts");
        } catch(err: any){
            setError(err.message ?? "Unknown Error");
            setSaving(false);
        } 
    }

    return (
        <RequireAuth>
            <main className="mx-auto max-w-4xl px-6 py-10">
                <header className="mb-8">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                        New Post
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Create a new note and choose whether to publish it immediately.
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
                            placeholder="Enter post title"
                            value={title} 
                            onChange={e=>setTitle(e.target.value)} 
                        required />    
                    </div>
                    
                    <div className="space-y-2">
                        <span className="block text-sm font-medium text-slate-700">
                            Status
                        </span>

                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                            <input type="checkbox" checked={is_published} onChange={e => {
                                setIs_published(e.target.checked)}}
                            className="h-4 w-4"/>

                            Published
                        </label>

                        <p className="text-xs text-slate-400">
                            Uncheck this to save the post as a draft.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                            Content
                        </label>

                        <MarkdownEditor value={content} onChange={setContent}></MarkdownEditor>
                    </div>
                   
                    <div className="space-y-2">
                        <TagInput value={tags} onChange={setTags}></TagInput>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                        <button type="button" 
                            className="cursor-pointer rounded-lg border border-slate-300 bg-white
                                   px-4 py-2 text-sm font-medium text-slate-700 transition
                                   hover:bg-slate-50
                                   disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => router.replace("/posts/my-posts")}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button type="submit" 
                            className="cursor-pointer rounded-lg bg-slate-900 px-4 py-2
                                   text-sm font-medium text-white transition hover:bg-slate-700
                                   disabled:cursor-not-allowed disabled:opacity-60" disabled={saving}
                        >
                            {saving? "Saving...": "Save"}
                        </button>
                    </div>                    
                </form>
            </main>
        </RequireAuth>
    );
}

