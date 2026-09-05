"use client"

import { apiFetch } from "@/lib/api";
import { useState } from "react";
import { evaluationQuestions } from "@/evaluation/datasets/evaluation_questions_v2";
import type { EvaluationQuestion } from "@/evaluation/schemas/evaluation";
import type { GenerationEvaluationResponse, GenerationEvaluationCaseResult, GenerationEvaluationRun } from "@/evaluation/schemas/generation_evaluation";
import type { RuntimeMetadata } from "@/evaluation/schemas/evaluation";

// temp
import { generation_judge_model_comparison_v1 } from "@/evaluation/calibration/generation_judge_model_comparison_v1";

export default function Page(props: {}){
    const [error, setError] = useState("")

    async function run_generation_evaluation(question: EvaluationQuestion): Promise<GenerationEvaluationCaseResult> {
         try {
            const res = await apiFetch("/api/v1/rag/generation_evaluate", {
                method : "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(
                    question
                )
            });

            const generationEvaluationResponse: GenerationEvaluationResponse = res;

            return {
                    id: generationEvaluationResponse.id,
                    query: question.query,
                    gold_answer: question.gold_answer,
                    generated_answer: generationEvaluationResponse.generated_answer,
                    expected_behavior: generationEvaluationResponse.expected_behavior,
                    judgements: generationEvaluationResponse.judgements,
                }           
        } catch(err: any){
            setError(err.message ?? "Unknown Error");
            throw err;
        } finally {
        }
    }
    
    async function get_runtime_metadata(): Promise<RuntimeMetadata>{
        try {
            const res = await apiFetch("/api/v1/rag/runtime_metadata", {
                method: "GET"              
            })
            const runtimeMetadata: RuntimeMetadata = res;
            return runtimeMetadata;
        } catch(err:any) {
            setError(err.message ?? "Unknown Error");
            throw err;
        } finally {
        }
    }

    async function run_generation_evaluation_and_save_results(): Promise<void>{
        const runtime_metadata = await get_runtime_metadata();

        const generationEvaluationCaseResults: GenerationEvaluationCaseResult[] = []
        for (const question of evaluationQuestions){
            const generationEvaluationCaseResult = await run_generation_evaluation(question);
            generationEvaluationCaseResults.push(generationEvaluationCaseResult);           
        }
        
        const generationEvaluationRun: GenerationEvaluationRun = {
            metadata: runtime_metadata,
            cases: generationEvaluationCaseResults,
        }

        const jsonData = JSON.stringify(generationEvaluationRun, null, 2);
        const blob = new Blob([jsonData], {type: "application/json"});

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "generation_evaluation_results.json"
        a.click()

        URL.revokeObjectURL(url);     
    }

    async function run_generate_generation_evaluation_response(){
        const judge_results = [];
        for (const data of generation_judge_model_comparison_v1) {
            const payload = {
                query: data.query,
                nugget: data.nugget,
                generated_answer: data.generated_answer
            }
            const judge_result = await apiFetch("/api/v1/rag/judge_comparison", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload)
            })
            judge_results.push(judge_result);
        }
        
        const judge_results_dict = {
            results: judge_results
        }

        const jsonData = JSON.stringify(judge_results_dict);
        const blob = new Blob([jsonData], {type: "application/json"});

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "judge_results.json";
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <main className="max-w-5xl mx-auto p-8 space-y-6">
            <button
                className="border rounded px-4 py-2"
                onClick={e => run_generation_evaluation_and_save_results()}
            >
                run_generation_evaluation_and_save_results
            </button>
            <button
                className="border rounded px-4 py-2"
                onClick={e => run_generate_generation_evaluation_response()}
            >
                run_generate_generation_evaluation_response_and_save_results
            </button>

            {evaluationQuestions.map((question:EvaluationQuestion) => {
                return (
                    <div
                        key={question.id}
                        className="border rounded-lg p-5 space-y-4"
                    >
                        <p className="font-semibold text-lg">
                            {question.id}: {question.query}
                        </p>

                        <h4 className="font-bold">
                            expected_behavior:
                        </h4>
                        <p>{question.expected_behavior}</p>
                        
                        {/* answer part */}
                        {/* {generation_eva_dict[question.id] && (
                            <div className="border-t pt-4 space-y-4">
                                <div className="border rounded p-4 space-y-3">
                                    <h4 className="font-bold">
                                        The generated answer:
                                    </h4>
                                    <p>{generation_eva_dict[question.id].generated_answer}</p> 
                                    
                                    <div className="border-l-4 pl-4 space-y-2">
                                        {generation_eva_dict[question.id].judgements.map(
                                            (judgement, index:number) => {
                                                const nugget = judgement.judgement_type === "refusal"? null : judgement.nugget;

                                                return (
                                                    <div key={index}>
                                                        {nugget && (<h5>Nugget: {nugget}</h5>)}
                                                        <h5>label: {judgement.label}</h5>
                                                        <h5>reason: {judgement.reason}</h5>                                         
                                                    </div>
                                                )
                                            }
                                        )}
                                    </div>
                                    </div> 
                                </div>                                                       
                        )} */}
                      
                    </div>
                )
            })}
        </main>        
    )
}