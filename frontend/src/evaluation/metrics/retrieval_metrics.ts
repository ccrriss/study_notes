import type { EvaluationResponse } from "../schemas/evaluation_v1";

export interface EvaluationCaseWithRR {
    id: string,
    query: string,
    gold_answer: string,
    generated_answer: string,
    gold_section?: string,
    reciprocal_rank: number
}

export interface EvaluationQuestion {
    id: string,
    query: string,
    gold_answer: string,
    gold_section?: string
}

export function get_mrr_and_reslist(evaluation_res_list: EvaluationResponse[], evaluationQuestions: EvaluationQuestion[]) {
    const evaluation_case_list: EvaluationCaseWithRR[] = [];
    let mrr_total = 0.0;
    let mrr_count = 0;

    for (const [index, res] of evaluation_res_list.entries()) {
        const evaluationQuestion = evaluationQuestions[index];
        const query_id = evaluationQuestion.id;
        const query = evaluationQuestion.query;
        const gold_answer = evaluationQuestion.gold_answer;
        const gold_section = evaluationQuestion.gold_section ?? "";

        const generated_answer = res.generated_answer;
        const raw_retrieved_results = res.raw_retrieved_results;
        
        // if hits gold_section then just calculate the mrr and break the loop
        // else return 0.0 as the rank
        let reciprocal_rank = 0.0
        for (const raw_retrieved_result of raw_retrieved_results) {
            const heading_path = raw_retrieved_result.heading_path.join(" > ");
            const rank = raw_retrieved_result.rank;

            if (heading_path == gold_section) {
                reciprocal_rank = 1 / rank;
                break;
            }
        }
        if (gold_section) {
            mrr_total += reciprocal_rank;
            mrr_count += 1;
        }
        evaluation_case_list.push({
            id: query_id,
            query: query,
            gold_answer: gold_answer,
            generated_answer: generated_answer,
            gold_section : gold_section,
            reciprocal_rank: reciprocal_rank
        })
    }

    const mrr_average = mrr_total / mrr_count;
    return {
        mrr_average,
        evaluation_case_list
    }   
}