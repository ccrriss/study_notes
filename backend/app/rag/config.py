from app.schemas.rag import EmbeddingConfig, ChunkingConfig, RetrievalConfig

EMBEDDING_CONFIG = EmbeddingConfig(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
                                   embedding_input="heading_path+content")
CHUNKING_CONFIG = ChunkingConfig(method="markdown-aware", max_seq_length=128, chunk_overlap=8)
RETRIEVAL_CONFIG = RetrievalConfig(top_k=3, similarity_method="cos_similarity")
