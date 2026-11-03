import Link from "next/link";

import { apiFetch } from "@/lib/api";
import SearchBar from "@/component/SearchBar";
import SortDropdown from "@/component/SortDropdown";
import PaginationPro from "@/component/PaginationPro";
import TagCloud from "@/component/TagCloud";

async function getNotes(page: number, q: string | null, tag: string | null, sort: string | null) {
    const limit = 10;
    const offset = (page - 1) * limit;

    const params = new URLSearchParams();
    params.set("offset", offset.toString());
    params.set("limit", limit.toString());
    if(q) {
        params.set("q", q);
    }
    if(tag) {
        params.set("tag", tag);
    }
    if(sort) {
        params.set("sort", sort);
    }
    
    const res = await apiFetch("/api/v1/posts?" + params.toString(), {cache: "no-store"});
    return res;
}

export default async function Page(props: {
  searchParams: Promise<{page?: string, q?: string, tag ?: string, sort ?: string}>
}) {
    const searchParams = await props.searchParams;
    const page = Number(searchParams.page || "1");
    const q = searchParams.q || null;
    const tag = searchParams.tag || null;
    const sort = searchParams.sort || "newest";

    const data = await getNotes(page, q, tag, sort);
    const {total, items} = data;

    const limit = 10;
    const totalPages = Math.ceil(total / limit);
    return (
        <main className="mx-auto max-w-6xl px-6 py-10">
            <header className="mb-8">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                    Notes
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    Browse published notes, search by title, or filter by topic.
                </p>
            </header>

            <SearchBar q={q} tag={tag}></SearchBar>
            
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
                {/*TagCloud*/}
                <TagCloud active={tag}></TagCloud>  

                {/*右侧内容*/}

                <section className="min-w-0">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            {tag && (
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="rounded-md bg-slate-100 px-3 py-1.5 text-sm text-slate-600">
                                        Filtering by tag: {" "} 
                                        <span className="font-medium text-slate-900">
                                            {tag}
                                        </span>
                                    </span>

                                    <Link href={"/posts"}
                                        className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
                                    >
                                        Clear Filters
                                    </Link>
                                </div>
                            )}
                        </div>
                        
                        <SortDropdown sort={sort}></SortDropdown>
                    </div>

                    {items.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                            <h2 className="text-base font-medium text-slate-900">
                                No notes found
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                Try changing your search or selected tag.
                            </p>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {items.map((post:any) => { 
                                return (
                                    <li key={post.id} 
                                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm
                                           transition hover:border-slate-300 hover:shadow"
                                    >
                                    <Link href={`/posts/${post.slug}`} 
                                        className="text-lg font-semibold text-slate-900 transition hover:text-slate-600">
                                        {post.title}
                                    </Link>

                                    {post.tags.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {post.tags.map((tag:string) => (
                                                <Link key = {tag} 
                                                    href = {`/posts?tag=${encodeURIComponent(tag)}`}
                                                    className="rounded-md bg-slate-100 px-2.5 py-1 text-xs
                                                        font-medium text-slate-600 transition
                                                        hover:bg-slate-200 hover:text-slate-900"
                                                >
                                                    {tag}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </li>
                            )})}
                        </ul>
                    )}

                    <PaginationPro current={page} totalPages={totalPages} q={q} tag={tag} sort={sort}></PaginationPro>
                </section>
            </div>
        </main>
    );
} 