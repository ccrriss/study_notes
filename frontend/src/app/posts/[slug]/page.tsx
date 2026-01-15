import Link from "next/link";
import Markdown from "@/component/Markdown";
import DeletePostButton from "@/component/DeletePostButton";

import { apiFetch } from "@/lib/api";

import PostActions from "@/component/PostActions";

async function getPost(slug: string){
    const res = await apiFetch(`/api/v1/posts/${slug}`, { cache : "no-store"});

    return res;
}

export default async function Page({params}:{params: Promise<{slug: string}>}) {
    const {slug} = await params;
    const p = await getPost(slug);

    return (
        <main className="prose p-8">
            <div className="flex items-center justify-between mb-4">
                <h1>{p.title}</h1>
                {p.tags.length > 0 && (
                    <div className="flex gap-2 mb-4">
                        {p.tags.map((t:any) => (
                            <Link key={t} 
                                className="px-2 py-1 text-sm bg-gray-200 rounded"
                                href={`/posts?tag=${encodeURIComponent(t)}`}
                            >
                                {t}
                            </Link>
                        ))}
                    </div>
                )}
                <div className="flex gap-2">
                    <Link href={`/posts`} className="px-3 py-1 rounded border text-sm">
                        Back
                    </Link>
                    <PostActions slug={slug} id={p.id}></PostActions>
                </div>
            </div>
            <Markdown md={p.content_md}></Markdown>
        </main>
    )
}