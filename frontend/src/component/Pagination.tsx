"use client";

import { useRouter } from "next/navigation";

export default function Pagination({
    current,
    totalPages,
    q,
    tag
}: {
    current: number;
    totalPages: number;
    q: string | null
    tag: string | null
}) {
    const router = useRouter();

    function go(page: number) {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        if(q) {
            params.set("q", q);
        }
        if(tag) {
            params.set("tag", tag)
        }

        router.push("/posts?" + params.toString());
    }

    return (
        <div className="flex gap-4 mt-6">
            <button
                disabled={current <= 1}
                className="px-3 py-1 border rounded disabled:opacity-40"
                onClick={() => go(current - 1)}
            >
                Prev
            </button>

            <span>
                Page {current}/{totalPages}
            </span>

            <button
                disabled={current>=totalPages}
                className="px-3 py-1 border rounded disabled:opacity-40"
                onClick={() => go(current + 1)}
            >
                Next
            </button>
        </div>
    );
}