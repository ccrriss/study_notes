from fastapi import APIRouter, Depends, Body
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated
from app.rag.vec_search import vector_search
from app.rag.prompts.get_prompt_v1 import get_prompt
from app.rag.genetate_answer_v1 import generate_answer
from sentence_transformers import SentenceTransformer
from app.schemas.rag import RagRequest, RagResponse, RagSource, RawRetrievedResult, EvaluationResponse
from app.schemas.rag import EvaluationQuestion, AnswerQuestion, RefuseQuestion, GenerationJudgement, GenerationEvaluationResponse
from app.db.models import PostChunk
from app.rag.generate_ragsec_and_source import generate_rag_section_and_source
from app.rag.evaluation.get_generation_evaluation_v2 import get_generation_evaluation_prompt, get_generation_evaluation_answer
from app.rag.evaluation.get_generation_evaluation_v2 import get_refuse_generation_evaluation_prompt, get_refuse_generation_evaluation_answer
import json

model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

router = APIRouter(prefix="/api/v1/rag", tags=['posts', 'rag'])

async def retrieve(payload: RagRequest, model: SentenceTransformer, 
                   db: AsyncSession) -> tuple[str, list[tuple[PostChunk, float]]]:
    query = payload.query
    if not query or not query.strip() or len(query.strip()) < 10:
        raise ValueError("query cannot be empty or it's too short")
    combined_rows = await vector_search(query=query, model=model, db=db)
    combined_prompt_text = get_prompt(query, combined_rows)
    generated_answer = await generate_answer(combined_prompt_text)
    return generated_answer, combined_rows

@router.post("", response_model=RagResponse)
async def generate_res(
    payload: Annotated[RagRequest, Body()],
    db: AsyncSession = Depends(get_db)
) -> RagResponse:
    generated_answer, combined_rows = await retrieve(payload=payload, model=model, db=db)

    combined_rag_source_list: list[RagSource] = generate_rag_section_and_source(combined_rows)

    res = RagResponse(sources=combined_rag_source_list,
                      answer=generated_answer)
    return res

@router.post("/evaluate", response_model=EvaluationResponse)
async def generate_evaluation(
    payload: Annotated[RagRequest, Body()],
    db: AsyncSession = Depends(get_db)
) -> EvaluationResponse:
    generated_answer, combined_rows = await retrieve(payload=payload, model=model, db=db)

    raw_retrieved_results_list: list[RawRetrievedResult] = []
    
    for i, (post_chunk, similarity) in enumerate(combined_rows):
        raw_retrieved_results_list.append(
            RawRetrievedResult(rank=i+1, similarity=similarity, post_id=post_chunk.post_id, chunk_idx=post_chunk.chunk_idx,
                title=post_chunk.post.title, slug=post_chunk.post.slug, heading_path=post_chunk.heading_path,
                content=post_chunk.content_chunk)
        )
    return EvaluationResponse(generated_answer=generated_answer, raw_retrieved_results=raw_retrieved_results_list)

@router.post("/generation_evaluate", response_model=GenerationEvaluationResponse)
async def create_generation_evaluate(
    payload: Annotated[EvaluationQuestion, Body()],
    db: AsyncSession = Depends(get_db)
) -> GenerationEvaluationResponse :
    generated_answer, combined_rows = await retrieve(payload=payload, model=model, db=db)
    query = payload.query
    judgement_list = []
    if isinstance(payload, AnswerQuestion):
        vital_nuggets = payload.vital_nuggets
        ok_nuggets = payload.ok_nuggets or []

        for vital_nugget in vital_nuggets:
            generation_evaluation_prompt = get_generation_evaluation_prompt(query=query, nugget=vital_nugget, generated_answer=generated_answer)
            res_json = await get_generation_evaluation_answer(generation_evaluation_prompt)
            res_dict = json.loads(res_json)
            label = res_dict["label"]
            reason = res_dict["reason"]

            judgement_list.append(GenerationJudgement(judgement_type="vital", nugget=vital_nugget, label=label, reason=reason))

        for ok_nugget in ok_nuggets:
            generation_evaluation_prompt = get_generation_evaluation_prompt(query=query, nugget=ok_nugget, generated_answer=generated_answer)
            res_json = await get_generation_evaluation_answer(generation_evaluation_prompt)
            res_dict = json.loads(res_json)
            label = res_dict["label"]
            reason = res_dict["reason"]

            judgement_list.append(GenerationJudgement(judgement_type="ok", nugget=ok_nugget, label=label, reason=reason))
    else:
        refuse_generation_evaluation_prompt = get_refuse_generation_evaluation_prompt(query=query, 
                                            gold_answer=payload.gold_answer, generated_answer=generated_answer)
        res_json = await get_refuse_generation_evaluation_answer(refuse_generation_evaluation_prompt)
        res_dict = json.loads(res_json)
        label = res_dict["label"]
        reason = res_dict["reason"]
        judgement_list.append(GenerationJudgement(judgement_type="refusal", label=label, reason=reason))
        
    return GenerationEvaluationResponse(
        id = payload.id,
        expected_behavior = payload.expected_behavior,
        generated_answer = generated_answer,
        judgements = judgement_list
    )

