from fastapi import APIRouter, Depends, Body
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated
from app.schemas.rag import RagRequest, RagResponse, RagSource
from app.schemas.evaluation import GenerationEvaluationQuestion, AnswerQuestion, GenerationJudgement, GenerationEvaluationResponse, RawRetrievedResult, RetrievalEvaluationResponse
from app.rag.sources import build_rag_sources
from app.rag.evaluation.prompts.generation_v2 import build_nugget_judge_prompt, build_refusal_judge_prompt
from app.rag.evaluation.generation_v2 import evaluate_generation
from app.rag.pipeline import run_rag_pipeline
import json

router = APIRouter(prefix="/api/v1/rag", tags=['posts', 'rag'])

@router.post("", response_model=RagResponse)
async def generate_rag_response(
    payload: Annotated[RagRequest, Body()],
    db: AsyncSession = Depends(get_db)
) -> RagResponse:
    generated_answer, combined_rows = await run_rag_pipeline(query=payload.query, db=db)

    combined_rag_source_list: list[RagSource] = build_rag_sources(combined_rows)

    rag_response = RagResponse(sources=combined_rag_source_list,
                      answer=generated_answer)
    return rag_response

@router.post("/evaluate", response_model=RetrievalEvaluationResponse)
async def generate_retrieval_evaluation_response(
    payload: Annotated[RagRequest, Body()],
    db: AsyncSession = Depends(get_db)
) -> RetrievalEvaluationResponse:
    generated_answer, combined_rows = await run_rag_pipeline(query=payload.query, db=db)

    raw_retrieved_results_list: list[RawRetrievedResult] = []
    
    for i, (post_chunk, similarity) in enumerate(combined_rows):
        raw_retrieved_results_list.append(
            RawRetrievedResult(rank=i+1, similarity=similarity, post_id=post_chunk.post_id, chunk_idx=post_chunk.chunk_idx,
                title=post_chunk.post.title, slug=post_chunk.post.slug, heading_path=post_chunk.heading_path,
                content=post_chunk.content_chunk)
        )
    return RetrievalEvaluationResponse(generated_answer=generated_answer, raw_retrieved_results=raw_retrieved_results_list)

@router.post("/generation_evaluate", response_model=GenerationEvaluationResponse)
async def generate_evaluate_generation_response(
    payload: Annotated[GenerationEvaluationQuestion, Body()],
    db: AsyncSession = Depends(get_db)
) -> GenerationEvaluationResponse :
    generated_answer, combined_rows = await run_rag_pipeline(query=payload.query, db=db)
    res = evaluate_generation(payload=payload, generated_answer=generated_answer)
    return res
