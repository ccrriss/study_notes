"use client"

import { useApiFetch } from "@/hooks/useApiFetch";
import { useState } from "react";

import type { RawRetrievedResult, EvaluationResponse, EvaluationCase, EvaluationV1 } from "@/evaluation/schemas/evaluation_v1";
import { evaluationQuestions } from "@/evaluation/datasets/evaluation_questions_v2";
import { evaluationMetadata } from "@/evaluation/configs/evaluation_v1_config";
import { get_mrr_and_reslist, EvaluationCaseWithRR } from "@/evaluation/metrics/retrieval_metrics";

export default function Page(props: {}){
    const api = useApiFetch();
    const [error, setError] = useState("")
    const [evaluationResponses, setEvaluationResponses] = useState<Record<string, EvaluationResponse>>({});

    const [evaluation_with_mrr_list, setEvaluation_with_mrr_list] = useState<EvaluationCaseWithRR[]>([]);
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
        const jsonData = JSON.stringify(evaluationData, null, 2);
        const blob = new Blob([jsonData], {type: "application/json"});

        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = "evaluation_v1_combined_results.json";
        a.click()

        URL.revokeObjectURL(url);
    }

    async function run_evaluation_and_get_mrr(){
        const res_list: EvaluationResponse[] = [];
        for (const question of evaluationQuestions) {
            const evaluationRes: EvaluationResponse = await get_answer(question.query, question.id);
            res_list.push(evaluationRes);
        }
        
        const evaluation_and_mrr_obj = get_mrr_and_reslist(res_list, evaluationQuestions);
        const mrr_avg = evaluation_and_mrr_obj["mrr_average"];
        const evaluation_case_list = evaluation_and_mrr_obj["evaluation_case_list"];
        setMrr_average(mrr_avg);
        setEvaluation_with_mrr_list(evaluation_case_list);
    }

    return (
        <main className="max-w-5xl mx-auto p-8 space-y-6">
            <button
                className="border rounded px-4 py-2"
                onClick={e => run_evaluation_and_save_results()}
            >
                Ask all questions and save
            </button>   
            <button
                className="border rounded px-4 py-2"
                onClick={e => run_evaluation_and_get_mrr()}
            >
                Ask all questions and get MRR and RR for each question
            </button>   
            {mrr_average != null && (
                <h4>Average mrr: {mrr_average}</h4>
            )}

            {evaluation_with_mrr_list && (evaluation_with_mrr_list.map((evaluation_case_with_mmr) => {
                return (
                    <div key={evaluation_case_with_mmr.id}>
                        <h5>Id: {evaluation_case_with_mmr.id}</h5>
                        <h5>Query: {evaluation_case_with_mmr.query}</h5>
                        <h5>Gold_answer: {evaluation_case_with_mmr.gold_answer}</h5>
                        <h5>Generated_answer: {evaluation_case_with_mmr.generated_answer}</h5>
                        <h5>Gold_section: {evaluation_case_with_mmr.gold_section}</h5>
                        <h5>Reciprocal_rank: {evaluation_case_with_mmr.reciprocal_rank}</h5>
                    </div>
                )
            }))}
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