import type { RetrievalEvaluationCaseResult, RetrievedResult } from "../schemas/retrieval_evaluation";

function calculate_reciprocal_rank(gold_section: string, retrived_results: RetrievedResult[]) {
    let reciprocal_rank = 0.0;

    for (const retrieved_result of retrived_results){
        const heading_text = retrieved_result.heading_path.join(" > ");
        if (gold_section === heading_text) {
            reciprocal_rank = 1 / retrieved_result.rank;
            break;
        }
    }

    return reciprocal_rank;
}

export function calculate_mrr(retrieval_evaluation_case_results: RetrievalEvaluationCaseResult[]) {
    let dense_mrr_total = 0.0;
    let dense_mrr_count = 0;
    let lexical_mrr_total = 0.0;
    let lexical_mrr_count = 0;
    let hybrid_mrr_total = 0.0;
    let hybrid_mrr_count = 0;

    for (const caseResult of retrieval_evaluation_case_results) { // answer and rawretrievedresults
        const id = caseResult.id;
        const query = caseResult.query;
        const gold_answer = caseResult.gold_answer;
        const gold_section = caseResult.gold_section;
        const generated_answer = caseResult.generated_answer;
        const dense_results = caseResult.dense_results;
        const lexical_results = caseResult.lexical_results;
        const hybrid_results = caseResult.hybrid_results;
        
        if (gold_section) {
            const dense_reciprocal_rank = calculate_reciprocal_rank(gold_section, dense_results);                      
            dense_mrr_total += dense_reciprocal_rank;
            dense_mrr_count += 1;
            const lexical_reciprocal_rank = calculate_reciprocal_rank(gold_section, lexical_results);                      
            lexical_mrr_total += lexical_reciprocal_rank;
            lexical_mrr_count += 1;
            const hybrid_reciprocal_rank = calculate_reciprocal_rank(gold_section, hybrid_results);                      
            hybrid_mrr_total += hybrid_reciprocal_rank;
            hybrid_mrr_count += 1;
        }
    }

    const dense_mrr_average = dense_mrr_count === 0? 0: dense_mrr_total / dense_mrr_count;
    const lexical_mrr_average = lexical_mrr_count === 0? 0: lexical_mrr_total / lexical_mrr_count;
    const hybrid_mrr_average = hybrid_mrr_count === 0? 0: hybrid_mrr_total / hybrid_mrr_count;
    return {
        dense_mrr_average: dense_mrr_average,
        lexical_mrr_average: lexical_mrr_average,
        hybrid_mrr_average: hybrid_mrr_average
    }   
}
