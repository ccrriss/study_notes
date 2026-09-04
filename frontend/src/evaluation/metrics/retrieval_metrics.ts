import type { RetrievalEvaluationCaseResult } from "../schemas/retrieval_evaluation";
export interface RetrievalEvaluationCaseWithRR {
    id: string,
    query: string,
    gold_answer: string,
    generated_answer: string,
    gold_section?: string,
    reciprocal_rank: number
}

export function calculate_mrr(retrieval_evaluation_case_results: RetrievalEvaluationCaseResult[]) {
    const evaluation_case_list: RetrievalEvaluationCaseWithRR[] = [];
    let mrr_total = 0.0;
    let mrr_count = 0;

    for (const caseResult of retrieval_evaluation_case_results) { // answer and rawretrievedresults
        const id = caseResult.id;
        const query = caseResult.query;
        const gold_answer = caseResult.gold_answer;
        const gold_section = caseResult.gold_section;
        const generated_answer = caseResult.generated_answer;
        const raw_retrieved_results = caseResult.raw_retrieved_results;
        
        // if hits gold_section then just calculate the mrr and break the loop
        // else return 0.0 as the rank
        let reciprocal_rank = 0.0
        if (gold_section) {

            for (const raw_retrieved_result of raw_retrieved_results) {
                const heading_path = raw_retrieved_result.heading_path.join(" > ");
                const rank = raw_retrieved_result.rank;
    
                if (heading_path === gold_section) {
                    reciprocal_rank = 1 / rank;
                    break;
                }
            }

            mrr_total += reciprocal_rank;
            mrr_count += 1;
        }

        evaluation_case_list.push({
            id: id,
            query: query,
            gold_answer: gold_answer,
            generated_answer: generated_answer,
            gold_section : gold_section,
            reciprocal_rank: reciprocal_rank
        })
    }

    const mrr_average = mrr_count === 0? 0: mrr_total / mrr_count;
    return {
        mrr_average,
        evaluation_case_list
    }   
}