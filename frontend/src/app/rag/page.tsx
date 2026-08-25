"use client"

import React, { useState } from "react";
import { useApiFetch } from "@/hooks/useApiFetch";
import Link from "next/link";
import type { RawRetrievedResult } from "@/evaluation/schemas/evaluation_v1";

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
    combined_source_list: RagSource[],
    combined_answer: string
}

interface EvaluationResponse {
    combined_answer: string,
    raw_retrieved_results: RawRetrievedResult[]
}

export default function Page(props: {}) {
    const api = useApiFetch();
    const [query, setQuery] = useState("");
    const [error, setError] = useState("")
    const [combined_source_list, setCombined_source_list] = useState<RagSource[]>([]);
    const [combined_answer, setCombined_answer] = useState("");
    const [raw_retrieved_results_list, setRaw_retrieved_results_list] = useState<RawRetrievedResult[]>([])

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
            setCombined_source_list(data.combined_source_list);
            setCombined_answer(data.combined_answer);
            
        } catch(err: any){
            setError(err.message ?? "Unknown Error");
        } finally {
        }
    }

    async function evaluate(query: string){
        const res = await api("/api/v1/rag/evaluate", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                query
            })
        });
        const data: EvaluationResponse = res;
        setCombined_answer(data.combined_answer);
        setRaw_retrieved_results_list(data.raw_retrieved_results);
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
                <button type="submit">Submit</button>
                <button type="button" onClick={e => evaluate(query)}>Evaluate</button>
            </form>
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
            {raw_retrieved_results_list.length > 0 && (
                <div>
                    <h4>Combined Answer:</h4>
                    <p>{combined_answer}</p>
                </div>               
            )}

            {raw_retrieved_results_list.length > 0 && raw_retrieved_results_list.map((raw_retrieved_result) => {
                return (
                    <div key={raw_retrieved_result.rank}>
                        <p>Rank: {raw_retrieved_result.rank}</p>
                        <p>Similarity: {raw_retrieved_result.similarity}</p>
                        <p>Post_id: {raw_retrieved_result.post_id}</p>
                        <p>Chunk_idx: {raw_retrieved_result.chunk_idx}</p>
                        <p>Title: {raw_retrieved_result.title}</p>
                        <p>Slug: {raw_retrieved_result.slug}</p>
                        <p>Heading_path: {raw_retrieved_result.heading_path.toString()}</p>
                        <p>Content: {raw_retrieved_result.content}</p>
                    </div>
                )
            })}
        </main>
    );
}