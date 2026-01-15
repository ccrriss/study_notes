"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SortDropdown({sort} : {sort: string}) {
    const router = useRouter();
    const params = useSearchParams();

    function updateSort(newSort:string) {
        const p = new URLSearchParams(params.toString());

        p.set("sort", newSort);
        p.set("page", "1"); //切换排序时回到第一页

        router.push("/posts?" + p.toString());
    }

    return (
        <select
            className="border rounded px-2 py-1 text-sm"
            value={sort}
            onChange={(e) => updateSort(e.target.value)}
        >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>

        </select>
    );
}