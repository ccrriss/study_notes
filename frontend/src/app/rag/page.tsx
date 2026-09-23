"use client"

import React, { useState } from "react";
import { useApiFetch } from "@/hooks/useApiFetch";
import Link from "next/link";
import type { RetrievedResult, RetrievalEvaluationResponse } from "@/evaluation/schemas/retrieval_evaluation";
import type { RagSection, RagResponse, RagSource } from "@/evaluation/schemas/rag";


export default function Page(props: {}) {
    const api = useApiFetch();
    const [query, setQuery] = useState("");
    const [error, setError] = useState("")

    // for user query
    const [sources, setSources] = useState<RagSource[]>([]);
    const [answer, setAnswer] = useState("");
    // for evaluate
    const [generated_answer, setGenerated_answer] = useState("");
    const [raw_retrieved_results, setRaw_retrieved_results] = useState<RetrievedResult[]>([])

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
            const ragResponse: RagResponse = res;
            setSources(ragResponse.sources);
            setAnswer(ragResponse.answer);
            
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
        const evaluationResponse: RetrievalEvaluationResponse = res;
        setGenerated_answer(evaluationResponse.generated_answer);
        setRaw_retrieved_results(evaluationResponse.dense_results);
    }

    return (
        <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
            <Link href={"/rag/retrieval_evaluation"} className="inline-flex mr-3 rounded-lg border border-slate-200
             bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
                prepared_questions
            </Link>
            <Link href={"/rag/generation_evaluation"} className="inline-flex mr-3 rounded-lg border border-slate-200
             bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
                generation_evaluation
            </Link>
            <Link href={"/rag/safety_test"} className="inline-flex mr-3 rounded-lg border border-slate-200
             bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
                safety_questions
            </Link>
            <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                {error && (
                    <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                        {error}
                    </p>
                )}
                <textarea placeholder="enter query then submit" value={query} onChange={e => setQuery(e.target.value)} 
                    className="w-full min-h-32 resize-y rounded-xl border border-slate-300 bg-slate-50 p-4
                     text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500
                    focus:bg-white focus:ring-2 focus:ring-slate-200" />

                <button type="submit" className="mr-3 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium
                 text-white transition hover:bg-slate-700">
                    Submit
                </button>
                <button type="button" onClick={e => evaluate(query)} className="rounded-lg border border-slate-300
                 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                    Evaluate
                </button>
            </form>

            {/* User Answer part:  */}
            {answer && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h5 className="mb-3 text-lg font-semibold text-slate-900">LLM Answer is: </h5>
                    <p className="whitespace-pre-wrap leading-7 text-slate-700">
                        {answer}
                    </p>
                </div>
            )}
            {sources && sources.map((rag_source: RagSource, index) => {
                return (
                    <div key={rag_source.slug} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h5 className="mb-3 text-lg font-semibold text-slate-900">Source {index + 1}: </h5>

                        <h5 className="font-medium text-slate-800">Title: {rag_source.title}</h5>

                        <h5 className="mt-1 text-sm text-slate-500">Slug: {rag_source.slug}</h5>
                        {rag_source.section_list.map((rag_section: RagSection, index) => {
                            return (
                                <div key={index} className="mt-4 border-t border-slate-100 pt-4">
                                    <h5 className="text-xs font-medium uppercase tracking-wide text-slate-400">Section {index}:</h5>
                                    <h5 className="mt-1 font-medium text-slate-800">{rag_section.heading}</h5>
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                                        {rag_section.content}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                )
            })}
            
            <h4 className="border-t border-slate-200 pt-8 text-xl font-semibold text-slate-900">Evaluation Part</h4>
            {raw_retrieved_results.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <h4 className="mb-2 font-semibold text-slate-800">Combined Answer:</h4>
                    <p className="leading-7 text-slate-700">{generated_answer}</p>
                </div>               
            )}

            {raw_retrieved_results.length > 0 && raw_retrieved_results.map((raw_retrieved_result) => {
                return (
                    <div key={raw_retrieved_result.rank} 
                        className="space-y-1 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
                        <p>Rank: {raw_retrieved_result.rank}</p>
                        <p>Similarity: {raw_retrieved_result.score}</p>
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