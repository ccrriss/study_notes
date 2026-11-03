import Link from "next/link";
import { apiFetch } from "@/lib/api"

type TagItem = {
    name: string;
    count: number;
}
async function getTags() {
    return apiFetch<TagItem[]>("/api/v1/tags");
}

export default async function TagCloud({active}:{active: string | null}) {
    const tags = await getTags();

    return (
        <aside className="self-start rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
                Tags
            </h2>

            <ul className="space-y-1">
                {tags && tags.map((tag) => (
                    <li key={tag.name}>
                        <Link href={`/posts?tag=${encodeURIComponent(tag.name)}`}
                            className={`flex items-center justify-between rounded-lg px-3 py-2
                                    text-sm transition
                                ${active === tag.name ? "bg-slate-900 text-white"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"} `}
                        >
                            <span>{tag.name}</span>

                            <span className={
                                active === tag.name
                                    ? "text-slate-300"
                                    : "text-slate-400"
                            }>
                                {tag.count}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </aside>
    )
}