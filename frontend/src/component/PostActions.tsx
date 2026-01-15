"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import DeletePostButton from "@/component/DeletePostButton";

export default function PostActions({slug, id}: {slug: string, id: number}){
    const {isLoggedIn} = useAuth();

    if(!isLoggedIn) return null;

    return (
        <div className="flex space-x-4 mb-4">
            <Link href={`/posts/${slug}/edit`} className="px-3 py-1 rounded border text-sm">
                Edit
            </Link>
            <DeletePostButton id={id}></DeletePostButton>
        </div>
    )
}