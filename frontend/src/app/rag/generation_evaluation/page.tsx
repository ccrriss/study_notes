"use client"

import { apiFetch } from "@/lib/api";
import { useState } from "react";
import { evaluationQuestions } from "@/evaluation/datasets/evaluation_questions_v2";
import type { EvaluationQuestion } from "@/evaluation/datasets/evaluation_questions_v2";

interface VitalNuggetJudgement {
    judgement_type: "vital",
    nugget: string,
    label: string,
    reason: string
}

interface OkNuggetJudgement {
    judgement_type: "ok",
    nugget: string,
    label: string,
    reason: string
}

interface RefuseJudgement {
    judgement_type: "refusal",
    label: string,
    reason: string
}

type GenerationJudgement = VitalNuggetJudgement | OkNuggetJudgement | RefuseJudgement;

interface GenerationEvaluationRes {
    id: string,
    expected_behavior: string, 
    generated_answer: string,
    judgements: GenerationJudgement[]
}

export default function Page(props: {}){
    const [error, setError] = useState("")
    const [generation_eva_dict, setGeneration_eva_dict] = useState<Record<string, GenerationEvaluationRes>>({});

    async function get_generation_eva_dict(question: EvaluationQuestion) {
         try {
            const res = await apiFetch("/api/v1/rag/generation_evaluate", {
                method : "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(
                    question
                )
            });

        const generation_eva_result: GenerationEvaluationRes = res;
        setGeneration_eva_dict(prev => {
            return {
                ...prev,
                [question.id]: generation_eva_result
            }
        })} catch(err: any){
            setError(err.message ?? "Unknown Error");
        } finally {
        }
    }
    
    async function get_all_generation_eva_results(){
        for (const question of evaluationQuestions){
            await get_generation_eva_dict(question);
        }
    }

    return (
        <main className="max-w-5xl mx-auto p-8 space-y-6">
            <button
                className="border rounded px-4 py-2"
                onClick={e => get_all_generation_eva_results()}
            >
                Get_all_generation_eva_results
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
                        {generation_eva_dict[question.id] && (
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
                        )}
                      
                    </div>
                )
            })}
        </main>        
    )
}