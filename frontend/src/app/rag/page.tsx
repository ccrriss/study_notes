"use client"

import React, { useState } from "react";
import { useApiFetch } from "@/hooks/useApiFetch";
import Link from "next/link";
import type { RetrievedResult, RetrievalEvaluationResponse } from "@/evaluation/schemas/retrieval_evaluation";
import type { RagSection, RagResponse, RagSource } from "@/evaluation/schemas/rag";
import { useAuth } from "@/context/AuthContext";
import { Fragment } from "react";

export default function Page(props: {}) {
    const api = useApiFetch();
    const [query, setQuery] = useState("");
    const [error, setError] = useState<string | null>(null);
    const {isAdmin} = useAuth()

    // for user query
    const [sources, setSources] = useState<RagSource[]>([]);
    const [answer, setAnswer] = useState("");
    // for evaluate
    const [generated_answer, setGenerated_answer] = useState("");
    const [raw_retrieved_results, setRaw_retrieved_results] = useState<RetrievedResult[]>([]);
    // for UI
    const [submitting, setSubmitting] = useState(false);
    const [evaluating, setEvaluating] = useState(false);

    async function submit(e:React.FormEvent){
        e.preventDefault();

        const normalizedQuery = query.trim();
        if(normalizedQuery.length < 10) {
            setError("Question must contain at least 10 characters.");
            return;
        }
        if(normalizedQuery.length > 500) {
            setError("Question must be less or equal than 500 characters.");
            return;
        }

        setSubmitting(true);
        setError(null);

        // clear the result area so the old answer will be cleared and not combined with new answers
        setSources([]);
        setAnswer("");

        try {
            const res = await api("/api/v1/rag", {
                method : "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    query: normalizedQuery
                })
            });
            const ragResponse: RagResponse = res;
            setSources(ragResponse.sources);
            setAnswer(ragResponse.answer);
            
        } catch(err: any){
            setError(err.message ?? "Unknown Error");
        } finally {
            setSubmitting(false);
        }
    }

    async function evaluate(query: string){
        const normalizedQuery = query.trim();
        if(normalizedQuery.length < 10) {
            setError("Question must contain at least 10 characters.");
            return;
        }
        if(normalizedQuery.length > 500) {
            setError("Question must be less or equal than 500 characters.");
            return;
        }

        setEvaluating(true);
        setError(null);

        try {
            const res = await api("/api/v1/rag/evaluate", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    query: normalizedQuery
                })
            });

            const evaluationResponse: RetrievalEvaluationResponse = res;

            setGenerated_answer(evaluationResponse.generated_answer);
            setRaw_retrieved_results(evaluationResponse.dense_results);
        } catch(err: any){
            setError(err.message ?? "Unknown error");
        } finally {
            setEvaluating(false);
        }
    }

    return (
        <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
            <header>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                    RAG Demo
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Ask questions about the published notes and review the sources used to generate the answer.
                </p>
            </header>

            {isAdmin && (
                <section>
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                        Admin Tools
                    </p>

                    <div className="flex flex-wrap gap-3">
                        <Link href={"/rag/retrieval_evaluation"} 
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2
                            text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            Retrieval Evaluation
                        </Link>

                        <Link href={"/rag/generation_evaluation"} 
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2
                            text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            Generation Evaluation
                        </Link>

                        <Link href={"/rag/safety_test"} 
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2
                            text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            Safety Test
                        </Link>
                    </div>
                </section>
            )}

            <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                        <p className="text-sm text-red-600">
                            {error}
                        </p>
                    </div>
                )}
                
                <div className="space-y-2">
                    <label
                        htmlFor="rag-query"
                        className="block text-sm font-medium text-slate-700"
                    >
                        Question
                    </label>

                    <textarea id="rag-query"
                        placeholder="Ask a question about the published notes..." 
                        value={query} onChange={e => setQuery(e.target.value)}
                        minLength={10}
                        maxLength={500}
                        required
                        className="min-h-32 w-full resize-y rounded-lg border border-slate-300
                        bg-white p-4 text-slate-800 outline-none transition
                        placeholder:text-slate-400
                        focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    />

                    <p className="text-xs text-slate-400">
                        Enter a question between 10 and 500 characters.
                    </p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                    <button type="submit" 
                        disabled = {submitting || evaluating}
                        className="cursor-pointer rounded-lg bg-slate-900 px-5 py-2.5
                            text-sm font-medium text-white transition hover:bg-slate-700
                            disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting ? "Generating..." : "Ask"}
                    </button>
                
                    {isAdmin && (
                        <button type="button"
                            disabled = {submitting || evaluating}
                            onClick={e => evaluate(query)} 
                            className="cursor-pointer rounded-lg border border-slate-300 bg-white
                                px-5 py-2.5 text-sm font-medium text-slate-700 transition
                                hover:bg-slate-50
                                disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {evaluating ? "Evaluating..." : "Evaluate"}
                        </button>
                    )}
                </div>
            </form>

            {/* User Answer part:  */}
            <Fragment>
                {answer && (
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-3 text-lg font-semibold text-slate-900">
                            Answer
                        </h2>

                        <p className="whitespace-pre-wrap leading-7 text-slate-700">
                            {answer}
                        </p>
                    </section>
                )}
                {sources.length > 0 && 
                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-slate-900">
                            Sources
                        </h2>

                        {sources.map((source: RagSource, sourceIndex) => {
                            return (
                            <article key={source.slug}
                                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                            >
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Source {sourceIndex + 1}: 
                                </p>

                                <Link href={`/posts/${source.slug}`}
                                    className="mt-2 inline-block font-semibold text-slate-900 transition hover:text-slate-600"
                                >
                                    {source.title}
                                </Link>

                                {source.section_list.map((section: RagSection, sectionIndex) => {
                                    return (
                                        <div key={sectionIndex}
                                                className="mt-4 border-t border-slate-100 pt-4"
                                        >
                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                                Section {sectionIndex + 1}
                                            </p>

                                            <h3 className="mt-1 font-medium text-slate-800">
                                                {section.heading}
                                            </h3>

                                            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                                                {section.content}
                                            </p>
                                        </div>
                                    )
                                })}
                            </article>
                            )
                        })}
                    </section>
                }
            </Fragment>
                                
            {isAdmin && (
                <Fragment>
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
                        })
                    }
                </Fragment> 
            )}
        </main>     
    );
}