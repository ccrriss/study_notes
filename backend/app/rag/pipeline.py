from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import PostChunk
from app.rag.retrieval_dense import retrieve_dense_chunks
from app.rag.prompts import answer_v1 as answer_prompt
from app.rag.config import RETRIEVAL_CONFIG
from app.schemas.evaluation import RetrievalEvaluationResponse
from typing import TYPE_CHECKING
# lexical search
from app.rag.retrieval_lexical import calculate_all_bm25_scores, find_top_k_lexical_search_results
from rank_bm25 import BM25Okapi
from sqlalchemy.orm import selectinload
# hybrid search pipeline
from app.rag.retrieval_hybrid import fuse_hybrid_retrieval_results
from app.schemas.evaluation import RetrievedResult, RetrievalEvaluationResponse, LatencyMeasurement

# reranking
from app.rag.reranking import generate_reranking_retrieved_results
# for deployment type checking
from app.rag.provider_protocols import RerankingProvider, EmbeddingProvider, GenerationProvider


# letency_ms
import time
# logging
from app.rag.logging import generate_logging

async def run_rag_pipeline(query: str, embedding_model: EmbeddingProvider, reranking_model: RerankingProvider, generation_model:GenerationProvider,
                           bm25: BM25Okapi, post_chunk_ids: list[int], db: AsyncSession,
                           request_id: str) -> RetrievalEvaluationResponse:
    # logging of start phase
    generate_logging(event="rag_request_started", request_id=request_id, query_length=len(query))
    stage = "start"
    
    # top_k
    try:
        stage = "dense"        
        dense_start = time.perf_counter()
        # Test exception raise, uncomment when needed
        # raise RuntimeError("test")
        dense_results = await run_dense_search_pipeline(query=query, embedding_model=embedding_model, db=db)
        dense_time = (time.perf_counter() - dense_start) * 1000

        stage = "lexical"
        lexical_start = time.perf_counter()
        lexical_results = await run_lexical_search_pipeline(query=query, bm25=bm25, post_chunk_ids=post_chunk_ids, db=db)
        lexical_time = (time.perf_counter() - lexical_start) * 1000

        stage = "hybrid"
        hybrid_start = time.perf_counter()
        hybrid_results = run_hybrid_search_pipeline(dense_results, lexical_results)
        hybrid_time = (time.perf_counter() - hybrid_start) * 1000
        # final_k
        stage = "reranking"
        reranking_start = time.perf_counter()
        reranking_results = await generate_reranking_retrieved_results(query=query, model=reranking_model, retrieved_results=hybrid_results)
        reranking_time = (time.perf_counter() - reranking_start) * 1000

        stage = "generation"
        generation_start = time.perf_counter()
        prompt_text = answer_prompt.build_prompt(user_query=query, retrieved_results=reranking_results)
        generated_answer = await generation_model.generate_answer(prompt=prompt_text, rules=answer_prompt.rules)
        generation_end = time.perf_counter()
        generation_time = (generation_end - generation_start) * 1000
        total_time = (generation_end - dense_start) * 1000

        retrieval_evaluation_res = RetrievalEvaluationResponse(
            generated_answer=generated_answer,
            dense_results=dense_results,
            lexical_results=lexical_results,
            hybrid_results=hybrid_results,
            reranking_results=reranking_results,
            latency=LatencyMeasurement(
                dense_ms = dense_time,
                lexical_ms = lexical_time,
                hybrid_ms = hybrid_time,
                reranking_ms = reranking_time,
                generation_ms = generation_time,
                total_ms = total_time
            )
        )

        generate_logging(event="rag_request_completed", request_id=request_id, total_ms=total_time)  

        return retrieval_evaluation_res
    except Exception as e:
        generate_logging(event="rag_request_failed", request_id=request_id, error=e, stage=stage)
        raise

async def run_dense_search_pipeline(query: str, embedding_model: EmbeddingProvider, db: AsyncSession) -> list[RetrievedResult]:
    dense_results: list[RetrievedResult] = []
    combined_rows = await retrieve_dense_chunks(query=query, embedding_model=embedding_model, db=db, top_k=RETRIEVAL_CONFIG.top_k)
    for i, (post_chunk, similarity) in enumerate(combined_rows):
        dense_results.append(
            RetrievedResult(rank=i+1, score=similarity, post_id=post_chunk.post_id, chunk_idx=post_chunk.chunk_idx,
                title=post_chunk.post.title, slug=post_chunk.post.slug, heading_path=post_chunk.heading_path,
                content=post_chunk.content_chunk)
        )
    return dense_results

async def run_lexical_search_pipeline(query: str, bm25: BM25Okapi, post_chunk_ids: list[int], db: AsyncSession) -> list[RetrievedResult]:
    lexical_results: list[RetrievedResult] = []
    
    bm_25_scores = calculate_all_bm25_scores(bm25, query)
    lexical_search_top_k_results = find_top_k_lexical_search_results(bm_25_scores, top_k=RETRIEVAL_CONFIG.top_k)

    for i, lexical_search_result in enumerate(lexical_search_top_k_results):
        idx_of_post_chunk_id = lexical_search_result[0]
        lexical_search_score = lexical_search_result[1]
        post_chunk_id = post_chunk_ids[idx_of_post_chunk_id]
        post_chunk = await db.get(PostChunk, post_chunk_id, options=[selectinload(PostChunk.post)])
        lexical_results.append(
            RetrievedResult(rank=i+1, score=lexical_search_score, post_id=post_chunk.post_id, chunk_idx=post_chunk.chunk_idx,
                            title=post_chunk.post.title, slug=post_chunk.post.slug, heading_path=post_chunk.heading_path,
                            content=post_chunk.content_chunk)
        )

    return lexical_results

def run_hybrid_search_pipeline(dense_results: list[RetrievedResult], lexical_results: list[RetrievedResult]) -> list[RetrievedResult]:
    hybrid_results = fuse_hybrid_retrieval_results(dense_results=dense_results, lexical_results=lexical_results, top_k=RETRIEVAL_CONFIG.top_k)
    return hybrid_results

