"use client";

import { useState } from "react";

export default function TagInput({
    value,
    onChange,
}: {
    value: string[],
    onChange: (tags: string[]) => void,
}) {
    const [input, setInput]= useState("");

    function addTag() {
        const t = input.trim();
        if(t !== "" && !value.includes(t)) {
            onChange([...value, t]);
        }
        setInput("");
    }

    function removeTag(tag: string) {
        onChange(value.filter((t) => t !== tag));
    }

    function handleKeyDown(e:React.KeyboardEvent<HTMLInputElement>){
        if(e.key === "Enter") {
            e.preventDefault();
            addTag();
        }
    }

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
                Tags
            </label>
            
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {value.map((tag) => (
                        <span 
                            key={tag} 
                            className="inline-flex items-center gap-1.5 rounded-md bg-slate-100
                                       px-2.5 py-1 text-xs font-medium text-slate-600"
                        >
                            {tag}
                            <button
                                type="button"
                                className="cursor-pointer text-slate-400 transition hover:text-red-500"
                                onClick={() => removeTag(tag)}
                                aria-label={`Remove ${tag}`}
                            >
                                &times;
                            </button>
                        </span>
                    ) 
                    )}
                </div>
            )}
            

            <div className="flex gap-2">
                <input 
                     className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white
                               px-3 py-2 text-sm text-slate-900 outline-none transition
                               placeholder:text-slate-400
                               focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    placeholder="Add tag..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button 
                    type="button"
                    className="cursor-pointer rounded-lg border border-slate-300 bg-white
                               px-4 py-2 text-sm font-medium text-slate-700 transition
                               hover:bg-slate-50"
                    onClick={addTag}
                >
                    Add
                </button>
            </div>
        </div>
    );
}