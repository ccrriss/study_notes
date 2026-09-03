from fastapi import APIRouter, Depends, Body
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated
from app.schemas.rag import RagRequest, RagResponse, RagSource
from app.schemas.evaluation import GenerationEvaluationQuestion, AnswerQuestion, GenerationJudgement, GenerationEvaluationResponse, RawRetrievedResult, RetrievalEvaluationResponse
from app.rag.sources import build_rag_sources
from app.rag.evaluation.generation_judge_v2 import build_nugget_judge_prompt, judge_nugget
from app.rag.evaluation.generation_judge_v2 import build_refusal_judge_prompt, judge_refusal
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
async def evaluate_generation(
    payload: Annotated[GenerationEvaluationQuestion, Body()],
    db: AsyncSession = Depends(get_db)
) -> GenerationEvaluationResponse :
    generated_answer, combined_rows = await run_rag_pipeline(query=payload.query, db=db)
    query = payload.query
    judgement_list = []
    if isinstance(payload, AnswerQuestion):
        vital_nuggets = payload.vital_nuggets
        ok_nuggets = payload.ok_nuggets or []

        for vital_nugget in vital_nuggets:
            generation_evaluation_prompt = build_nugget_judge_prompt(query=query, nugget=vital_nugget, generated_answer=generated_answer)
            res_json = await judge_nugget(generation_evaluation_prompt)
            res_dict = json.loads(res_json)
            label = res_dict["label"]
            reason = res_dict["reason"]

            judgement_list.append(GenerationJudgement(judgement_type="vital", nugget=vital_nugget, label=label, reason=reason))

        for ok_nugget in ok_nuggets:
            generation_evaluation_prompt = build_nugget_judge_prompt(query=query, nugget=ok_nugget, generated_answer=generated_answer)
            res_json = await judge_nugget(generation_evaluation_prompt)
            res_dict = json.loads(res_json)
            label = res_dict["label"]
            reason = res_dict["reason"]

            judgement_list.append(GenerationJudgement(judgement_type="ok", nugget=ok_nugget, label=label, reason=reason))
    else:
        refuse_generation_evaluation_prompt = build_refusal_judge_prompt(query=query,
                                            gold_answer=payload.gold_answer, generated_answer=generated_answer)
        res_json = await judge_refusal(refuse_generation_evaluation_prompt)
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

