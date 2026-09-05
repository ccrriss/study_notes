export interface RawRetrievedResult {
    rank: number,
    similarity: number,
    post_id: number,
    chunk_idx: number,
    title: string,
    slug: string,
    heading_path: string[],
    content: string
}

export interface RetrievalEvaluationResponse {
    generated_answer: string,
    raw_retrieved_results: RawRetrievedResult[]
}

export interface RetrievalEvaluationCaseResult {
    id: string,
    query: string,
    gold_answer: string,
    generated_answer: string,
    gold_section?: string,
    raw_retrieved_results: RawRetrievedResult[]
}

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