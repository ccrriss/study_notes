from fastapi import APIRouter, Depends, Body
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated
from app.schemas.rag import RagRequest, RagResponse, RagSource, RuntimeMetadata, ModelRuntimeData, ModelOptions
from app.schemas.evaluation import JudgeResult, GenerationEvaluationQuestion, GenerationEvaluationResponse, RawRetrievedResult, RetrievalEvaluationResponse
from app.rag.sources import build_rag_sources
from app.rag.evaluation.generation import evaluate_generation, judge_nugget
from app.rag.pipeline import run_rag_pipeline
from app.core.version import get_git_version
from app.rag.evaluation.judge import JUDGE_MODEL_NAME, JUDGE_OPTIONS
from app.rag.generation import GENERATION_MODEL_NAME, GENERATION_OPTIONS
from app.rag.evaluation.prompts import generation_v2 as judge_prompt
from app.rag.prompts import answer_v1 as answer_prompt
from app.rag.config import CHUNKING_CONFIG, EMBEDDING_CONFIG, RETRIEVAL_CONFIG

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
async def generate_generation_evaluation_response(
    payload: Annotated[GenerationEvaluationQuestion, Body()],
    db: AsyncSession = Depends(get_db)
) -> GenerationEvaluationResponse :
    generated_answer, combined_rows = await run_rag_pipeline(query=payload.query, db=db)
    res = await evaluate_generation(payload=payload, generated_answer=generated_answer)
    return res

@router.get("/runtime_metadata", response_model=RuntimeMetadata)
def get_runtime_metadata():
    code_version = get_git_version()
    generation_metadata = ModelRuntimeData(model=GENERATION_MODEL_NAME, prompt_version=answer_prompt.PROMPT_VERSION,
                                           options=ModelOptions.model_validate(GENERATION_OPTIONS))
    judge_metadata = ModelRuntimeData(model=JUDGE_MODEL_NAME, prompt_version=judge_prompt.PROMPT_VERSION,
                                           options=ModelOptions.model_validate(JUDGE_OPTIONS))
    return RuntimeMetadata(code_version=code_version,
                           generation=generation_metadata,
                           judge=judge_metadata,
                           chunking=CHUNKING_CONFIG,
                           embedding=EMBEDDING_CONFIG,
                           retrieval=RETRIEVAL_CONFIG)

# TEMP
@router.post("/judge_comparison", response_model=JudgeResult)
async def generate_generation_comparison_response(
    payload: Annotated[dict, Body()],
    db: AsyncSession = Depends(get_db)
) -> JudgeResult:
    judge_result:JudgeResult = await judge_nugget(query=payload["query"], nugget=payload["nugget"],
                        generated_answer=payload["generated_answer"])
    return judge_result
