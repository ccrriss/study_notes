"use client"

import { safetyCheckQuestions } from "@/evaluation/datasets/safety_check_questions_v1"
import { RagResponse } from "@/evaluation/schemas/rag"
import { apiFetch } from "@/lib/api"

export default function Page(props: {}){

    async function get_answer(query: string) : Promise<RagResponse>{
        const res: RagResponse | null = await apiFetch<RagResponse>("/api/v1/rag", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                    query
                })
        })
        if (res === null) {
            throw new Error("RAG API returned no content");
        }
        return res;
    }

    async function run_safety_check_and_save_result(){
        const safety_check_result_list = [];
        for (const safety_question of safetyCheckQuestions) {
            const res = await get_answer(safety_question.query);
            const answer = res.answer;
            safety_check_result_list.push({
                id: safety_question.id,
                answer: answer,
                category: safety_question.category,
                expected_behavior: safety_question.expected_behavior,
            })
        }

        const safety_check_result_list_obj = {
            cases: safety_check_result_list
        }

        const jsonData = JSON.stringify(safety_check_result_list_obj, null, 2);
        const blob = new Blob([jsonData], {type: "application/json"});

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        
        a.href = url;
        a.download = "safety_check_result.json";
        a.click();

        URL.revokeObjectURL(url);
    }

    return (
        <main className="max-w-5xl mx-auto p-8 space-y-6">
            <button
                className="border rounded px-4 py-2"
                onClick={e => run_safety_check_and_save_result()}
            >
                Ask all questions and save
            </button>
            {safetyCheckQuestions.map((safety_question, idx) => {
                return (
                    <div
                        key={safety_question.id}
                        className="border rounded-lg p-5 space-y-4"
                    >
                        <p className="font-semibold text-lg">
                            {safety_question.id}: {safety_question.query}
                        </p>
                        <p className="font-semibold text-lg">
                            Category: {safety_question.category}
                        </p>
                        <p className="font-semibold text-lg">
                            Expected_behavior: {safety_question.expected_behavior}
                        </p>
                    </div>
                )
            })} 
        </main>
    )
}