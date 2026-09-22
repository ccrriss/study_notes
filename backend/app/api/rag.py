from fastapi import APIRouter, Depends, Body, status, HTTPException
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated
from app.schemas.rag import RagRequest, RagResponse, RagSource, RuntimeMetadata, ModelRuntimeData, ModelOptions
from app.schemas.evaluation import JudgeResult, GenerationEvaluationQuestion, GenerationEvaluationResponse, RetrievedResult, RetrievalEvaluationResponse
from app.rag.sources import build_rag_sources
from app.rag.evaluation.generation import evaluate_generation, judge_nugget
from app.rag.pipeline import run_rag_pipeline
from app.core.version import get_git_version
from app.rag.evaluation.judge import JUDGE_MODEL_NAME, JUDGE_OPTIONS
from app.rag.generation import GENERATION_MODEL_NAME, GENERATION_OPTIONS
from app.rag.evaluation.prompts import generation_v2 as judge_prompt
from app.rag.prompts import answer_v1 as answer_prompt
from app.rag.config import CHUNKING_CONFIG, EMBEDDING_CONFIG, RETRIEVAL_CONFIG, RERANKING_CONFIG

# for type checking
from app.rag.provider_protocols import EmbeddingProvider, RerankingProvider, GenerationProvider

# lexical search
from fastapi import Request
# hybrid search
from rank_bm25 import BM25Okapi
# structured logging
import uuid

async def generate_request_id(request: Request):
    request.state.request_id = uuid.uuid4().hex[:8]

router = APIRouter(prefix="/api/v1/rag", tags=['posts', 'rag'], dependencies=[Depends(generate_request_id)])

@router.post("", response_model=RagResponse)
async def generate_rag_response(
    payload: Annotated[RagRequest, Body()],
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> RagResponse:
    query = payload.query

    bm25:BM25Okapi = request.app.state.bm25
    post_chunk_ids = request.app.state.post_chunk_ids
    embedding_model: EmbeddingProvider = request.app.state.embedding_model
    reranking_model: RerankingProvider = request.app.state.reranking_model
    generation_model: GenerationProvider = request.app.state.generation_model
    request_id = request.state.request_id

    try:
        retrieval_evaluation_res = await run_rag_pipeline(query=query, embedding_model=embedding_model, reranking_model=reranking_model,
                                                          generation_model=generation_model, db=db, 
                                                      bm25=bm25, post_chunk_ids=post_chunk_ids, request_id=request_id)
        generated_answer = retrieval_evaluation_res.generated_answer
        reranking_results = retrieval_evaluation_res.reranking_results

        rag_source_list: list[RagSource] = build_rag_sources(retrieved_results=reranking_results)

        rag_response = RagResponse(sources=rag_source_list,
                        answer=generated_answer)
        return rag_response
    except Exception:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "rag request failed")

@router.post("/evaluate", response_model=RetrievalEvaluationResponse)
async def generate_retrieval_evaluation_response(
    payload: Annotated[RagRequest, Body()],
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> RetrievalEvaluationResponse:
    query = payload.query

    bm25:BM25Okapi = request.app.state.bm25
    post_chunk_ids = request.app.state.post_chunk_ids
    embedding_model: EmbeddingProvider = request.app.state.embedding_model
    reranking_model: RerankingProvider = request.app.state.reranking_model
    generation_model: GenerationProvider = request.app.state.generation_model
    request_id = request.state.request_id

    try :
        retrieval_evaluation_res = await run_rag_pipeline(query=query, embedding_model=embedding_model, reranking_model=reranking_model,
                                                          generation_model=generation_model, db=db,  
                                                      bm25=bm25, post_chunk_ids=post_chunk_ids, request_id=request_id)
        return retrieval_evaluation_res
    except Exception:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "rag request failed")                                    

@router.post("/generation_evaluate", response_model=GenerationEvaluationResponse)
async def generate_generation_evaluation_response(
    payload: Annotated[GenerationEvaluationQuestion, Body()],
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> GenerationEvaluationResponse :
    query = payload.query
    
    bm25:BM25Okapi = request.app.state.bm25
    post_chunk_ids = request.app.state.post_chunk_ids
    embedding_model: EmbeddingProvider = request.app.state.embedding_model
    reranking_model: RerankingProvider = request.app.state.reranking_model
    generation_model: GenerationProvider = request.app.state.generation_model
    request_id = request.state.request_id

    try:
        retrieval_evaluation_res = await run_rag_pipeline(query=query, embedding_model=embedding_model, reranking_model=reranking_model,
                                                          generation_model=generation_model, db=db, 
                                                        bm25=bm25, post_chunk_ids=post_chunk_ids, request_id=request_id)
        generated_answer = retrieval_evaluation_res.generated_answer

        res = await evaluate_generation(payload=payload, generated_answer=generated_answer)
        return res
    except Exception:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "rag request failed")


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
                           retrieval=RETRIEVAL_CONFIG,
                           reranking=RERANKING_CONFIG)

# TEMP, used for comparing 4b and 8b model judge
@router.post("/judge_comparison", response_model=JudgeResult)
async def generate_generation_comparison_response(
    payload: Annotated[dict, Body()],
    db: AsyncSession = Depends(get_db)
) -> JudgeResult:
    judge_result:JudgeResult = await judge_nugget(query=payload["query"], nugget=payload["nugget"],
                        generated_answer=payload["generated_answer"])
    return judge_result
