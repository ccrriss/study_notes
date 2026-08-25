from fastapi import APIRouter, Depends, Body
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated
from app.api.util.vec_search import vector_search
from app.api.util.get_prompt_v1 import get_prompt
from app.api.util.genetate_answer_v1 import generate_answer
from sentence_transformers import SentenceTransformer
from app.schemas.rag import RagRequest, RagResponse, RagSource, RawRetrivedResult, EvaluationResponse
from app.db.models import PostChunk
from app.api.util.generate_ragsec_and_source import generate_rag_section_and_source

model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

router = APIRouter(prefix="/api/v1/rag", tags=['posts', 'rag'])

async def retrieve(payload: RagRequest, model: SentenceTransformer, 
                   db: AsyncSession) -> tuple[str, list[tuple[PostChunk, float]]]:
    query = payload.query
    if not query or not query.strip() or len(query.strip()) < 10:
        raise ValueError("query cannot be empty or it's too short")
    combined_rows = await vector_search(query=query, model=model, db=db)
    combined_prompt_text = get_prompt(query, combined_rows)
    combined_answer = await generate_answer(combined_prompt_text)
    return combined_answer, combined_rows

@router.post("", response_model=RagResponse)
async def generate_res(
    payload: Annotated[RagRequest, Body()],
    db: AsyncSession = Depends(get_db)
) -> RagResponse:
    combined_answer, combined_rows = await retrieve(payload=payload, model=model, db=db)

    combined_rag_source_list: list[RagSource] = generate_rag_section_and_source(combined_rows)

    res = RagResponse(combined_source_list=combined_rag_source_list,
                      combined_answer=combined_answer)
    return res

@router.post("/evaluate", response_model=EvaluationResponse)
async def generate_evaluation(
    payload: Annotated[RagRequest, Body()],
    db: AsyncSession = Depends(get_db)
) -> EvaluationResponse:
    combined_answer, combined_rows = await retrieve(payload=payload, model=model, db=db)

    check_set: set[tuple[int, int]] = set()
    raw_retrieved_results_list: list[RawRetrivedResult] = []
    for i, (post_chunk, similarity) in enumerate(combined_rows):
        check_key = (post_chunk.post_id, post_chunk.chunk_idx)
        if check_key in check_set:
            continue
        else:
            check_set.add(check_key)
        raw_retrieved_results_list.append(
            RawRetrivedResult(rank=i+1, similarity=similarity, post_id=post_chunk.post_id, chunk_idx=post_chunk.chunk_idx,
                title=post_chunk.post.title, slug=post_chunk.post.slug, heading_path=post_chunk.heading_path,
                content=post_chunk.content_chunk)
        )
    return EvaluationResponse(combined_answer=combined_answer, raw_retrieved_results=raw_retrieved_results_list)
