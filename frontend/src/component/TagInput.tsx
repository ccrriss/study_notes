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
        <div>
            <label className="block text-sm mb-1 font-medium">Tags</label>
            
            <div className="flex flex-wrap gap-2 mb-2">
                {value.map((tag) => (
                    <span 
                        key={tag} 
                        className="px-2 py-1 bg-gray-200 text-gray-700 rounded flex items-center text-sm"
                    >
                        {tag}
                        <button
                            type="button"
                            className="ml-2 text-red-500 text-4xl"
                            onClick={() => removeTag(tag)}
                        >
                            &times;
                        </button>
                    </span>
                  ) 
                )}
            </div>

            <div className="flex gap-2">
                <input 
                    className="border p-2 flex-1 rounded"
                    placeholder="Add tag..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button 
                    type="button"
                    className="px-3 py-1 bg-black text-white rounded"
                    onClick={addTag}
                >
                    Add
                </button>
            </div>
        </div>
    )
}