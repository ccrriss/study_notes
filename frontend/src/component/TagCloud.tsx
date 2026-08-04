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
        <aside className="p-4 border rounded bg-gray-50 w-48">
            <h2 className="text-lg font-bold">Tags</h2>

            <ul className="space-y-2">
                {tags && tags.map((t) => (
                    <li key={t.name}>
                        <Link href={`/posts?tag=${encodeURIComponent(t.name)}`}
                            className={`flex justify-between px-2 py-1 rounded hover:bg-gray-100 text-sm
                                ${active === t.name?"bg-black text-white":""} `}
                        >
                            <span>{t.name}</span>
                            <span>({t.count})</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </aside>
    )
}