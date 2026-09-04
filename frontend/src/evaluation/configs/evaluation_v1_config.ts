import type { EvaluationMetadata } from "../schemas/retrieval_evaluation"

export const evaluationMetadata : EvaluationMetadata = {
    code_version: "e18febd",
    prompt_version: "v1",
    evaluation_config: "evaluation_v1",
    embedding_config: {
      embedding_input: "heading_path+content",
      name: "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
      max_seq_len: 128
    },
    retrieval_config: {
      top_k: 3,
      similarity_method: "cos_similarity"
    },
    chunking_config: {
      method: "markdown-aware",
      chunk_overlap: 8
    },
    llm_config: {
      name: "qwen3:4b-instruct-2507-q4_K_M",
      options: {
        num_ctx: 4096,
        temperature: 0,
        seed: 42
      }
    }
}