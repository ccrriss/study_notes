"use client";

import { useRouter } from "next/navigation";

const buttonClass =
    "cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 " +
    "text-sm text-slate-600 transition hover:bg-slate-50 " +
    "disabled:cursor-not-allowed disabled:opacity-30";

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

    const start = Math.max(1, current - 2);
    const end = Math.min(totalPages, current + 2);

    for (let p = start; p <= end; p++){
        pages.push(p);
    }

    const showLeftEllipsis = start > 1;
    const showRightEllipsis = end < totalPages;

    return (
        <nav className="mt-8 flex flex-wrap items-center gap-2">
            {/*去首页*/}
            <button onClick={() => go(1)}
                disabled={current === 1}
                className={buttonClass}
            >
                {"<<"}
            </button>

            {/*上一页*/}
            <button onClick={() => go(current - 1)}
                disabled={current === 1}
                className={buttonClass}
            >
                {"<"}
            </button>

            {/*左省略号*/}
            {showLeftEllipsis && (
                <>
                    <button
                        className={buttonClass}
                        onClick={() => go(1)}
                    >
                        1
                    </button>
                    <span className="px-1 text-slate-400">...</span>
                </>
            )}

            {/*中间数字按钮*/}
            {pages.map((page) => (
                <button
                    key={page}
                    className={page === current
                        ? "cursor-pointer rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
                        : buttonClass}
                    onClick={() => go(page)}
                >
                    {page}
                </button>
            ))}

            {/*右省略号*/}
            {showRightEllipsis && (
                <>
                    <span className="px-1 text-slate-400">...</span>
                    <button
                        className={buttonClass}
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
                className={buttonClass}
            >
                {">"}
            </button>

            {/*末页*/}
            <button
                onClick={() =>go(totalPages)}
                disabled={current === totalPages}
                className={buttonClass}
            >
                {">>"}
            </button>
        </nav>
    );
}