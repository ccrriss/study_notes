"use client";

import { useRouter } from "next/navigation";

export default function CancelButton({saving=false}:{saving ?: boolean}){
    const router = useRouter();
    return (
        <button disabled={saving}
                className="px-4 py-2 rounded border" 
                onClick={() => router.push("/")}
                type="button"
        >   
            Cancel
        </button>
    )
}