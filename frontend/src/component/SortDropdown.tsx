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
            className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2
               text-sm text-slate-700 outline-none transition
               focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            value={sort}
            onChange={(e) => updateSort(e.target.value)}
        >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
        </select>
    );
}