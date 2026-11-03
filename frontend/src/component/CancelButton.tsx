"use client";

import { useRouter } from "next/navigation";

export default function CancelButton({saving=false, destination}:{saving ?: boolean, destination: string}){
    const router = useRouter();
    return (
        <button disabled={saving}
                onClick={() => router.replace(destination)}
                type="button"
                className="cursor-pointer rounded-lg border border-slate-300 bg-white
                    px-4 py-2 text-sm font-medium text-slate-700 transition
                    hover:bg-slate-50
                    disabled:cursor-not-allowed disabled:opacity-60"
        >   
            Cancel
        </button>
    )
}