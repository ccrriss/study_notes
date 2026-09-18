export interface RetrievedResult {
    rank: number,
    score: number,
    post_id: number,
    chunk_idx: number,
    title: string,
    slug: string,
    heading_path: string[],
    content: string
}

export interface LatencyMeasurement {
    dense_ms: number,
    lexical_ms: number,
    hybrid_ms: number,
    reranking_ms: number,
    generation_ms: number,
    total_ms: number
}

export interface RetrievalEvaluationResponse {
    generated_answer: string,
    dense_results: RetrievedResult[],
    lexical_results: RetrievedResult[],
    hybrid_results: RetrievedResult[],
    reranking_results: RetrievedResult[]
    latency: LatencyMeasurement
}

export interface RetrievalEvaluationCaseResult {
    id: string,
    query: string,
    gold_answer: string,
    generated_answer: string,
    gold_section?: string,
    dense_results: RetrievedResult[],
    lexical_results: RetrievedResult[],
    hybrid_results: RetrievedResult[],
    reranking_results: RetrievedResult[],
    latency: LatencyMeasurement

}
// v1 version @deprecated
export interface RetrievalEvaluationMetadataV1 {
    code_version: string,
    prompt_version: string,
    evaluation_config: string,
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
    llm_config: {
        name: string,
        options: {
            num_ctx: number, 
            temperature: number,
            seed: number
        }
    }
}
export interface RetrievalEvaluationRunV1 {
    metadata: RetrievalEvaluationMetadataV1,
    cases: RetrievalEvaluationCaseResult[]
}