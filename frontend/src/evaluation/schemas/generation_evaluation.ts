// GenerationEvaluation
import type { RuntimeMetadata } from "./evaluation";

// GenerationJudgement
export interface GenerationJudgement {
    judgement_type: "vital" | "ok" | "refusal",
    nugget: string | null,
    label: string,
    reason: string
}

export interface GenerationEvaluationResponse {
    id: string,
    expected_behavior: "answer" | "refuse", 
    generated_answer: string,
    judgements: GenerationJudgement[]
}

export interface GenerationEvaluationCaseResult {
    id: string,
    query: string,
    gold_answer: string,
    generated_answer: string,
    expected_behavior: "answer" | "refuse", 
    judgements: GenerationJudgement[]
}

export interface GenerationEvaluationMetadata {
    runtime: RuntimeMetadata,

    embedding_config: {
        embedding_input: string,
        name: string,
        max_seq_len: number
    },
    retrieval_config: {
        top_k: number,
        similarity_method: string
    },
    chunking_config: {
        method: string,
        chunk_overlap: number
    },
}

export interface GenerationEvaluationRun {
    metadata: GenerationEvaluationMetadata,
    cases: GenerationEvaluationCaseResult[]
}