"use client";

import { useRouter } from "next/navigation";

export default function PaginationPro({
    current,
    totalPages,
    q,
    tag,
    sort
}: {
    current: number;
    totalPages: number;
    q: string | null;
    tag: string | null;
    sort: string | null;
}) {
    const router = useRouter();

    function go(page: number) {
        const params = new URLSearchParams();

        params.set("page", page.toString());
        if(q) {
            params.set("q", q);
        }
        if(tag) {
            params.set("tag", tag);
        }

        if(sort) {
            params.set("sort", sort);
        }

        router.push("/posts?" + params.toString());
    }

    if (totalPages <= 1) return null;

    //生成页码范围
    const pages: number[] = [];
    const maxDisplay = 5; //当前页附近显示5个

    const start = Math.max(1, current - 2);
    const end = Math.min(totalPages, current + 2);

    for (let p = start; p <= end; p++){
        pages.push(p);
    }

    const showLeftEllipsis = start > 1;
    const showRightEllipsis = end < totalPages;

    return (
        <div className="flex items-center gap-2 mt-6 text-sm">
            {/*去首页*/}
            <button onClick={() => go(1)}
                disabled={current === 1}
                className="px-2 py-1 border rounded disabled:opacity-30"
            >
                {"<<"}
            </button>

            {/*上一页*/}
            <button onClick={() => go(current - 1)}
                disabled={current === 1}
                className="px-2 py-1 border rounded disabled:opacity-30"
            >
                {"<"}
            </button>

            {/*左省略号*/}
            {showLeftEllipsis && (
                <>
                    <button
                        className="px-2 py-1 border rounded"
                        onClick={() => go(1)}
                    >
                        1
                    </button>
                    <span className="px-1">...</span>
                </>
            )}

            {/*中间数字按钮*/}
            {pages.map(p => (
                <button
                    key={p}
                    className={`px-2 py-1 border rounded ${p === current? "bg-black text-white": ""}`}
                    onClick={() => go(p)}
                >
                    {p}
                </button>
            ))}

            {/*右省略号*/}
            {showRightEllipsis && (
                <>
                    <span className="px-1">...</span>
                    <button
                        className="px-2 py-1 border rounded"
                        onClick={() => go(totalPages)}
                    >
                        {totalPages}
                    </button>
                </>
            )}

            {/*下一页*/}
            <button
                onClick={() => go(current + 1)}
                disabled={current === totalPages}
                className="px-2 py-1 border rounded disabled:opacity-30"
            >
                {">"}
            </button>

            {/*末页*/}
            <button
                onClick={() =>go(totalPages)}
                disabled={current === totalPages}
                className="px-2 py-1 broder rounded disabled:opacity-30"
            ></button>
        </div>
    );
}