// User part
interface RagSection {
    heading: string,
    content: string
}

interface RagSource {
    title: string,
    slug: string,
    section_list: RagSection[]
}

interface RagResponse {
    content_only_source_list: RagSource[],
    combined_source_list: RagSource[],
    content_only_answer: string,
    combined_answer: string
}

interface RagQuery {
    query: string
}

interface USER_RES_v1 {
    generated_answer: string,
    sources: RagSource[]
}

// Evaluation part
interface RawRetrievedResult {
    rank: number,
    similarity: number,
    post_id: number,
    chunk_idx: number,
    title: string,
    slug: string,
    heading_path: string[],
    content: string
}

interface EvaluationCase {
    id: string,
    query: string,
    gold_answer: string,
    generated_answer: string,
    gold_section?: string,
    raw_retrieved_results: RawRetrievedResult[]
}
interface EvaluationV1 {
    metadata: {
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
    },
    cases: EvaluationCase[]
}