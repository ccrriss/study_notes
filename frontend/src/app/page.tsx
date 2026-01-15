import Link from "next/link";

import { apiFetch } from "@/lib/api";
import SearchBar from "@/component/SearchBar";
import Pagination from "@/component/Pagination";
import SortDropdown from "@/component/SortDropdown";
import PaginationPro from "@/component/PaginationPro";

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
        <main className="max-w-3xl mx-auto p-8 space-y-4">
            <SearchBar q={q} tag={tag}></SearchBar>
            <header className="flex items-center justify-between">
                <h1 className="text-2xl font-bold mb-4">Notes</h1>
                <SortDropdown sort={sort}></SortDropdown>

                {tag && (
                    <div className="mb-4 flex items-center gap-4">
                        <span className="px-2 py-1 bg-gray-100 rounded">
                            Filtering by tag: <b>{tag}</b>
                        </span>

                        <Link href={"/posts"} className="underline text-sm">
                            Clear Filters
                        </Link>
                    </div>
                    )

                }
            </header>

            <ul className="space-y-3">
                {items.map((n:any) => { 
                    return (
                    <li key={n.id} 
                        className="border p-3 rounded hover:bg-gray-50 transition"
                    >
                        <Link href={`/posts/${n.slug}`} className="font-medium underline">
                            {n.title}
                        </Link>

                        {n.tags.length > 0 && (
                            <div className="flex gap-2 mt-2">
                                {n.tags.map( (t:string) => (
                                    <Link key = {t} 
                                        href = {`/posts?tag=${encodeURIComponent(t)}`}
                                        className="px-2 py-1 bg-gray-100 text-sm rounded hover:bg-gray-200"
                                    >
                                        {t}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </li>
                )})}
            </ul>

            <PaginationPro current={page} totalPages={totalPages} q={q} tag={tag} sort={sort}></PaginationPro>
        </main>
    );
} 