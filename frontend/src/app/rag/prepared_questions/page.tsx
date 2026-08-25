"use client"

import { useApiFetch } from "@/hooks/useApiFetch";
import { useState } from "react";

import type { RawRetrievedResult, EvaluationResponse, EvaluationCase, EvaluationV1 } from "@/evaluation/schemas/evaluation_v1";
import { evaluationQuestions } from "@/evaluation/datasets/evaluation_questions_v1";
import { evaluationMetadata } from "@/evaluation/configs/evaluation_v1_config";

export default function Page(props: {}){
    const api = useApiFetch();
    const [error, setError] = useState("")
    const [evaluationResponses, setEvaluationResponses] = useState<Record<string, EvaluationResponse>>({});

    async function get_answer(query:string, id:string) {
        try {
            const res = await api("/api/v1/rag/evaluate", {
                method : "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    query
                })
            });
            const evaluationResponse: EvaluationResponse = res;
            setEvaluationResponses(prev => {
                return {
                    ...prev,
                    [id]: evaluationResponse
                    }
            })
            return evaluationResponse;
        } catch(err: any){
            setError(err.message ?? "Unknown Error");
            throw err;
        } finally {            
        }
    }
    
    async function run_evaluation_and_save_results(){
        let evaluationCases: EvaluationCase[] = [];
        for (const question of evaluationQuestions){
            const evaluationRes: EvaluationResponse = await get_answer(question.query, question.id);
            evaluationCases.push({
                id: question.id,
                query: question.query,
                gold_answer: question.gold_answer,
                generated_answer: evaluationRes.generated_answer,
                gold_section: question.gold_section ?? undefined,
                raw_retrieved_results: evaluationRes.raw_retrieved_results
            });
        }
        const evaluationData: EvaluationV1 = {
            metadata: evaluationMetadata,
            cases: evaluationCases
        };
        const jsonData = JSON.stringify(evaluationData);
        const blob = new Blob([jsonData], {type: "application/json"});

        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = "evaluation_v1.json";
        a.click()

        URL.revokeObjectURL(url);
    }

    return (
        <main className="max-w-5xl mx-auto p-8 space-y-6">
            <button
                className="border rounded px-4 py-2"
                onClick={e => run_evaluation_and_save_results()}
            >
                Ask all questions and save
            </button>   
            {evaluationQuestions.map((question:any) => {
                return (
                    <div
                        key={question.id}
                        className="border rounded-lg p-5 space-y-4"
                    >
                        <p className="font-semibold text-lg">
                            {question.id}: {question.query}
                        </p>
                        <button
                            className="border rounded px-4 py-2"
                            onClick={e => get_answer(question.query, question.id)}
                        >
                            Ask this question
                        </button>
                        {/* answer part */}
                        {evaluationResponses[question.id] && (
                            <div className="border-t pt-4 space-y-4">
                                <div className="border rounded p-4 space-y-3">
                                    <h4 className="font-bold">The correct answer:</h4>
                                    <p>{question.right_answer}</p>
                                    <h4 className="font-bold">Gold Section:</h4>
                                    <p>{question.gold_section}</p>           

                                    {/* Generated answer part */}
                                    <div className="border rounded p-4 space-y-3">

                                        <h4 className="font-bold">Generated answer:</h4>
                                        <p>{evaluationResponses[question.id].generated_answer}</p>    

                                        <div className="border-l-4 pl-4 space-y-2">
                                            <h5>Raw retrieved results:</h5>
                                            {evaluationResponses[question.id].raw_retrieved_results.map(
                                                (raw_retrieved_result:RawRetrievedResult, index:number) => {
                                                return (
                                                    <div key={index}>
                                                        <h5>Rank: {raw_retrieved_result.rank}</h5>
                                                        <h5>Similarity: {raw_retrieved_result.similarity}</h5>
                                                        <h5>Post_id: {raw_retrieved_result.post_id}</h5>
                                                        <h5>Chunk_idx: {raw_retrieved_result.chunk_idx}</h5>
                                                        <h5>Title: {raw_retrieved_result.title}</h5>
                                                        <h5>Slug: {raw_retrieved_result.slug}</h5>
                                                        <h5>Heading_path: {raw_retrieved_result.heading_path.join(" > ")}</h5>
                                                        <h5>Content: {raw_retrieved_result.content}</h5>                                                       
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div> 
                                </div>  
                            </div>                            
                        )}
                    </div>
                )
            })}
        </main>        
    )
}