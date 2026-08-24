from fastapi import APIRouter, Depends, Query, Body
from app.db.session import get_db
from sqlalchemy import select
from app.db.models import Post, Tag, PostChunk
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Annotated
from app.api.util.vec_search import vector_search
from app.api.util.get_prompt_v1 import get_prompt
from app.api.util.genetate_answer_v1 import generate_answer
from sentence_transformers import SentenceTransformer
from app.schemas.rag import RagRequest, RagResponse, RagSection, RagSource
from app.api.util.generate_ragsec_and_source import generate_rag_sec_and_source

model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

router = APIRouter(prefix="/api/v1/rag", tags=['posts', 'rag'])

@router.post("", response_model=RagResponse)
async def retrieval(
    payload: Annotated[RagRequest, Body()],
    db: AsyncSession = Depends(get_db)
) -> RagResponse:
    query = payload.query
    if not query or not query.strip() or len(query.strip()) < 10:
        raise ValueError("query cannot be empty or it's too short")
    
    rows, combined_rows = await vector_search(query=query, model=model, db=db)

    prompt_text, combined_prompt_text = get_prompt(query, rows, combined_rows)
    
    content_only_answer = await generate_answer(prompt=prompt_text)
    combined_answer = await generate_answer(prompt=combined_prompt_text)

    content_only_rag_source_list: list[RagSource] = generate_rag_sec_and_source(rows)
    combined_rag_source_list: list[RagSource] = generate_rag_sec_and_source(combined_rows)

    res = RagResponse(content_only_source_list=content_only_rag_source_list, combined_source_list=combined_rag_source_list,
                       content_only_answer=content_only_answer, combined_answer=combined_answer)
    return res