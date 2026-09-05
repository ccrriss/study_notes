// This is stable structure and can be imported to be used by versions of evaluation v*

// Modelruntime Metadata
export interface ModelOptions {
    temperature: number,
    seed: number,
    num_ctx: number
}

export interface ModelRuntimeData {
    model: string,
    prompt_version: string,
    options: ModelOptions
}

export interface EmbeddingConfig {
    model_name: string, 
    embedding_input: string
}

export interface ChunkingConfig {
    method: string,
    max_seq_length: number,
    chunk_overlap: number
}

export interface RetrievalConfig {
    top_k: number, 
    similarity_method: string
}

export interface RuntimeMetadata {
    code_version: string,
    generation: ModelRuntimeData,
    judge: ModelRuntimeData,
    chunking: ChunkingConfig,
    embedding: EmbeddingConfig, 
    retrieval: RetrievalConfig
}

// Evaluation Questions
interface BaseEvaluationQuestion {
    id: string,
    query: string,
    gold_answer: string,
    expected_behavior: "answer" | "refuse",
    gold_section?: string
}

interface AnswerQuestion extends BaseEvaluationQuestion {
    expected_behavior: "answer",
    vital_nuggets: string[],
    ok_nuggets?: string[]
}

interface RefusalQuestion extends BaseEvaluationQuestion {
    expected_behavior: "refuse"
}

export type EvaluationQuestion = AnswerQuestion | RefusalQuestion;