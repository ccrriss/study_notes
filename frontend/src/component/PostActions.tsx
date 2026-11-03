"use client";

import Link from "next/link";
import DeletePostButton from "@/component/DeletePostButton";

export default function PostActions({id}: { id: number}){

    return (
        <div className="flex items-center gap-3">
            <Link href={`/posts/my-posts/${id}/edit`} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium
                 text-slate-700 transition hover:bg-slate-50">
                Edit
            </Link>
            <DeletePostButton id={id}></DeletePostButton>
        </div>
    )
}