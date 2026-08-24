"use client"

import React, { useState } from "react";
import { useApiFetch } from "@/hooks/useApiFetch";
import Link from "next/link";

interface RagSection {
    heading: string,
    content: string
}

interface RagSource {
    title: string,
    slug: string,
    section_list: RagSection[]
}

interface RagResponse {
    content_only_source_list: RagSource[],
    combined_source_list: RagSource[],
    content_only_answer: string,
    combined_answer: string
}

export default function Page(props: {}) {
    const api = useApiFetch();
    const [query, setQuery] = useState("");
    const [error, setError] = useState("")
    const [content_only_source_list, setContent_only_source_list] = useState<RagSource[]>([]);
    const [combined_source_list, setCombined_source_list] = useState<RagSource[]>([]);
    const [content_only_answer, setContent_only_answer] = useState("");
    const [combined_answer, setCombined_answer] = useState("");


    async function submit(e:React.FormEvent){
        e.preventDefault();

        try {
            const res = await api("/api/v1/rag", {
                method : "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    query
                })
            });
            const data: RagResponse = res;
            setContent_only_source_list(data.content_only_source_list);
            setCombined_source_list(data.combined_source_list);
            setContent_only_answer(data.content_only_answer);
            setCombined_answer(data.combined_answer);
            
        } catch(err: any){
            setError(err.message ?? "Unknown Error");
        } finally {
        }
    }

    return (
        <main className="max-w-5xl mx-auto p-8 space-y-4">
            <Link href={"/rag/prepared_questions"} className="font-medium">prepared_questions</Link>
            <Link href={"/rag/prepared_holdout_questions"} className="font-medium">prepared_holdout_questions</Link>
            <form onSubmit={submit}>
                {error && (
                    <p className="text-sm text-red-500 border border-red-200 p-2 rounded">
                        {error}
                    </p>
                )}
                <textarea placeholder="enter query then submit" value={query} onChange={e => setQuery(e.target.value)} 
                    className="w-full min-h-32 border rounded p-3"></textarea>
                <button>Submit</button>
            </form>
            {content_only_source_list && content_only_source_list.map((rag_source: RagSource, index) => {
                    return (
                        <div key={rag_source.slug}>
                            <h5>Content_only Answer{index + 1}: </h5>                           
                            <h5>Title: {rag_source.title}</h5>
                            <h5>Slug: {rag_source.slug}</h5>
                            {rag_source.section_list.map((rag_section: RagSection, index) => {
                                return (
                                    <div key={index}>
                                        <h5>Section {index + 1}:</h5>
                                        <h5>{rag_section.heading}</h5>
                                        <p className="whitespace-pre-wrap">
                                            {rag_section.content}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
                {content_only_answer && (
                    <div>
                        <h5>Content-only Answer: </h5>
                        <p className="whitespace-pre-wrap">
                            {content_only_answer}
                        </p>
                    </div>
                )}
                {combined_source_list && combined_source_list.map((rag_source: RagSource, index) => {
                    return (
                        <div key={rag_source.slug}>
                            <h5>Combined Answer{index + 1}: </h5>

                            <h5>Title: {rag_source.title}</h5>

                            <h5>Slug: {rag_source.slug}</h5>
                            {rag_source.section_list.map((rag_section: RagSection, index) => {
                                return (
                                    <div key={index}>
                                        <h5>Section {index}:</h5>
                                        <h5>{rag_section.heading}</h5>
                                        <p className="whitespace-pre-wrap">
                                            {rag_section.content}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
                {combined_answer && (
                    <div>
                        <h5>Combined Answer: </h5>
                        <p className="whitespace-pre-wrap">
                            {combined_answer}
                        </p>
                    </div>
                )}
        </main>
    );
}