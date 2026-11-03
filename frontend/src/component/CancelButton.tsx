"use client";

import { useRouter } from "next/navigation";

export default function CancelButton({saving=false, destination}:{saving ?: boolean, destination: string}){
    const router = useRouter();
    return (
        <button disabled={saving}
                className="px-4 py-2 rounded border" 
                onClick={() => router.replace(destination)}
                type="button"
        >   
            Cancel
        </button>
    )
}