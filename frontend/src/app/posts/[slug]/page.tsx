import Link from "next/link";
import Markdown from "@/component/Markdown";

import { apiFetch } from "@/lib/api";

async function getPost(slug: string){
    const res = await apiFetch(`/api/v1/posts/${slug}`, { cache : "no-store"});

    return res;
}

export default async function Page({params}:{params: Promise<{slug: string}>}) {
    const {slug} = await params;
    const post = await getPost(slug);

    return (
        <main className="mx-auto max-w-4xl px-6 py-10">
            <div className="mb-6">
                <Link
                    href="/posts"
                    className="text-sm text-slate-500 transition hover:text-slate-900"
                >
                    ← Back to Notes
                </Link>
            </div>

            <header className="mb-8">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                    {post.title}
                </h1>

                {post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {post.tags.map((tag:string) => (
                            <Link key={tag} 
                                href={`/posts?tag=${encodeURIComponent(tag)}`}
                                className="rounded-md bg-slate-100 px-2.5 py-1 text-xs
                                       font-medium text-slate-600 transition
                                       hover:bg-slate-200 hover:text-slate-900"
                            >
                                {tag}
                            </Link>
                        ))}
                    </div>
                )}
            </header>
            
            <article className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                <Markdown md={post.content_md}></Markdown>          
            </article>
        </main>
    );
}