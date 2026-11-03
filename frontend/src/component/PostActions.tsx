"use client";

import Link from "next/link";
import DeletePostButton from "@/component/DeletePostButton";

export default function PostActions({id}: { id: number}){

    return (
        <div className="flex space-x-4 mb-4">
            <Link href={`/posts/my-posts/${id}/edit`} className="px-3 py-1 rounded border text-sm">
                Edit
            </Link>
            <DeletePostButton id={id}></DeletePostButton>
        </div>
    )
}