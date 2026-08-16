import PaginationPro from "@/component/PaginationPro";
import SearchBar from "@/component/SearchBar";
import SortDropdown from "@/component/SortDropdown";
import TagCloud from "@/component/TagCloud";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

async function getChunks(page:number, q: string|null, tag:string|null, sort: string|null) {
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

    const res = await apiFetch("/api/v1/rag?" + params.toString(), {cache: "no-store"});
    return res;
}

export default async function Page(props: {
    searchParams: Promise<{page?: string, q?: string, tag?: string, sort?: string}>
}) {
    const searchParams = await props.searchParams;
    const page = Number(searchParams.page || "1");
    const q = searchParams.q || null;
    const tag = searchParams.tag || null;
    const sort = searchParams.sort || "newest";

    const data = await getChunks(page, q, tag, sort);
    const {chunks} = data;

    return (
        <main className="max-w-5xl mx-auto p-8 space-y-4">
            
            <div className="gap-8"> 
                <div>
                    <ul className="space-y-3">
                        {chunks.map((chunk:any, index:any) => { 
                            return (
                                <li key={index}
                                className="border p-3 rounded"
                                >   
                                    <h3 className="font-medium"><b>Post_id</b>:{chunk.post_id} </h3>
                                    <h3 className="font-medium"><b>Chunk_idx</b>:{chunk.chunk_idx} </h3>
                                    <h3 className="font-medium"><b>Title</b>:{chunk.title} </h3>
                                    <p className="font-medium">
                                        <b>Slug</b>: {chunk.slug}                                    
                                    </p>
                                    <p className="font-bold">Tags:</p>
                                    {chunk.tags.map((tag: string) => {
                                        return <p key={tag}>{tag}</p>
                                    })}
                                    <p className="font-bold">Content:</p>
                                    <p>{chunk.content_chunk}</p>
                                </li>
                        )})}
                    </ul>
                </div>
            </div>
        </main>
    );
}