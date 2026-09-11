"use client"

import { useApiFetch } from "@/hooks/useApiFetch";
import { useState } from "react";
import type {  RetrievalEvaluationRunV1 } from "@/evaluation/schemas/retrieval_evaluation";
import { evaluationQuestions } from "@/evaluation/datasets/evaluation_questions_v2";
import { retrievalEvaluationMetadataV1 } from "@/evaluation/configs/retrieval_evaluation_v1_config";
import { calculate_mrr } from "@/evaluation/metrics/retrieval_metrics";
import { RetrievalEvaluationResponse, RetrievalEvaluationCaseResult, RetrievedResult } from "@/evaluation/schemas/retrieval_evaluation";

export default function Page(props: {}){
    const api = useApiFetch();
    const [error, setError] = useState("")
    const [evaluationResponses, setEvaluationResponses] = useState<Record<string, RetrievalEvaluationResponse>>({});
    const [mrr_average, setMrr_average] = useState<number | null>(null);

    async function get_answer(query:string, id:string) {
        try {
            const res = await api("/api/v1/rag/evaluate", {
                method : "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    query
                })
            });
            const evaluationResponse: RetrievalEvaluationResponse = res;
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
    
    async function run_retrieval_evaluation(): Promise<RetrievalEvaluationCaseResult[]>{
        let evaluationCases: RetrievalEvaluationCaseResult[] = [];

        for (const question of evaluationQuestions){
            const evaluationRes: RetrievalEvaluationResponse = await get_answer(question.query, question.id);
            evaluationCases.push({
                id: question.id,
                query: question.query,
                gold_answer: question.gold_answer,
                generated_answer: evaluationRes.generated_answer,
                gold_section: question.gold_section ?? undefined,
                dense_results: evaluationRes.dense_results,
                lexical_results: evaluationRes.lexical_results,
                hybrid_results: evaluationRes.hybrid_results,
                reranking_results: evaluationRes.reranking_results
            });
        }
        return evaluationCases;
    }

    async function run_retrieval_evaluation_and_save_results(){
        let evaluationCases = await run_retrieval_evaluation();

        const evaluationData: RetrievalEvaluationRunV1 = {
            metadata: retrievalEvaluationMetadataV1,
            cases: evaluationCases
        };

        // save the result as json
        const jsonData = JSON.stringify(evaluationData, null, 2);
        const blob = new Blob([jsonData], {type: "application/json"});

        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = "evaluation_v1_combined_results.json";
        a.click()

        URL.revokeObjectURL(url);
    }

 
    async function run_retrieval_evaluation_and_calculate_rrf(){
        let evaluationCases = await run_retrieval_evaluation();

        const mrr_obj = calculate_mrr(evaluationCases);

        const rrf_and_mrr_list_obj = {
            list: evaluationCases,
            dense_mrr: mrr_obj["dense_mrr_average"],
            lexical_mrr: mrr_obj["lexical_mrr_average"],
            hybrid_mrr: mrr_obj["hybrid_mrr_average"],
            reranking_mrr: mrr_obj["reranking_mrr_average"],
            dense_recall: mrr_obj['dense_recall'],
            lexical_recall: mrr_obj['lexical_recall'],
            hybrid_recall: mrr_obj['hybrid_recall'],
            reranking_recall: mrr_obj['reranking_recall']
        };

        const jsonData = JSON.stringify(rrf_and_mrr_list_obj, null, 2);
        const blob = new Blob([jsonData], {type: "application/json"});
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = "rrf_list.json";
        a.click();

        URL.revokeObjectURL(url);
    }

    return (
        <main className="max-w-5xl mx-auto p-8 space-y-6">
            <button
                className="border rounded px-4 py-2"
                onClick={e => run_retrieval_evaluation_and_save_results()}
            >
                Ask all questions and save
            </button>   
            <button
                className="border rounded px-4 py-2"
                onClick={e => run_retrieval_evaluation_and_calculate_rrf()}
            >
                run_retrieval_evaluation_and_calculate_rrf_and_mrr_and_save
            </button>     
            {mrr_average != null && (
                <h4>Average mrr: {mrr_average}</h4>
            )}


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
                                    <p>{question.gold_answer}</p>
                                    <h4 className="font-bold">Gold Section:</h4>
                                    <p>{question.gold_section}</p>           

                                    {/* Generated answer part */}
                                    <div className="border rounded p-4 space-y-3">

                                        <h4 className="font-bold">Generated answer:</h4>
                                        <p>{evaluationResponses[question.id].generated_answer}</p>    

                                        <div className="border-l-4 pl-4 space-y-2">
                                            <h5>Raw retrieved results:</h5>
                                            {evaluationResponses[question.id].dense_results.map(
                                                (dense_result:RetrievedResult, index:number) => {
                                                return (
                                                    <div key={index}>
                                                        <h5>Rank: {dense_result.rank}</h5>
                                                        <h5>Similarity: {dense_result.score}</h5>
                                                        <h5>Post_id: {dense_result.post_id}</h5>
                                                        <h5>Chunk_idx: {dense_result.chunk_idx}</h5>
                                                        <h5>Title: {dense_result.title}</h5>
                                                        <h5>Slug: {dense_result.slug}</h5>
                                                        <h5>Heading_path: {dense_result.heading_path.join(" > ")}</h5>
                                                        <h5>Content: {dense_result.content}</h5>                                                       
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