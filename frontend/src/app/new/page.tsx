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
                    }),
                }
            );

            router.push("/posts");
        } catch(err: any){
            setError(err.message ?? "Unknown Error");
        } finally{
            setSaving(false);
        }
    }

    return (
        <RequireAuth>
            <main className="p-8 max-w-6xl mx-auto space-y-4">
                <h1 className="text-2xl font-bold mb-4">Add Note</h1>

                <form onSubmit={submit} className="space-y-3">
                    {error && (
                        <p className="text-sm text-red-500 border-red-200 border p-2 rounded">
                            {error}
                        </p>
                    )}
                    <input 
                        className="border w-full p-2 rounded" 
                        placeholder="Title" 
                        value={title} 
                        onChange={e=>setTitle(e.target.value)} 
                        required>    
                    </input>
                    <MarkdownEditor value={content} onChange={setContent}></MarkdownEditor>
                    <TagInput value={tags} onChange={setTags}></TagInput>
                    <button type="button" 
                            className="px-4 py-2 rounded border" 
                            onClick={() => router.push("/posts")}
                            disabled={saving}>
                        Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 rounded bg-black text-white disabled:opacity-60" disabled={saving}>
                        {saving? "Saving...": "Save"}
                    </button>
                </form>
            </main>
        </RequireAuth>
    )
}

