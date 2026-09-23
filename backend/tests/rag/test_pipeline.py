import app.rag.pipeline as pipeline
from unittest.mock import AsyncMock, MagicMock
import pytest
from app.schemas.evaluation import RetrievedResult

query = "test query"
embedding_model = MagicMock()
reranking_model = MagicMock()
generation_model = MagicMock()
fake_generated_answer = "fake generated answer"
generation_model.generate_answer = AsyncMock(
    return_value = fake_generated_answer
)
bm25 = MagicMock()
post_chunks = [1, 2]
db = MagicMock()
request_id = "test-request"

@pytest.mark.anyio
async def test_run_rag_pipeline(monkeypatch):
    fake_dense_results = [
        RetrievedResult(rank=1, score=1, post_id=1, chunk_idx=1, title="fake_dense_1", slug="fd1", content="fake_dense_1_content", heading_path=["fd1"]),
        RetrievedResult(rank=2, score=0.5, post_id=1, chunk_idx=2, title="fake_dense_2", slug="fd2", content="fake_dense_2_content", heading_path=["fd2"]),
    ]
    dense_mock = AsyncMock(return_value=fake_dense_results)
    monkeypatch.setattr(
        pipeline,
        "run_dense_search_pipeline",
        dense_mock
    )

    fake_lexical_results = [
        RetrievedResult(rank=1, score=1, post_id=1, chunk_idx=1, title="fake_lexical_1", slug="fl1", content="fake_lexical_1_content", heading_path=["fl1"]),
        RetrievedResult(rank=2, score=0.5, post_id=1, chunk_idx=2, title="fake_lexical_2", slug="fl2", content="fake_lexical_2_content", heading_path=["fl2"]),
    ]
    lexical_mock = AsyncMock(return_value=fake_lexical_results)
    monkeypatch.setattr(
        pipeline,
        "run_lexical_search_pipeline",
        lexical_mock
    )

    fake_hybrid_results = [
        RetrievedResult(rank=1, score=1, post_id=1, chunk_idx=1, title="fake_hybrid_1", slug="fh1", content="fake_hybrid_1_content", heading_path=["fh1"]),
        RetrievedResult(rank=2, score=0.5, post_id=1, chunk_idx=2, title="fake_hybrid_2", slug="fh2", content="fake_hybrid_2_content", heading_path=["fh2"]),
    ]
    hybrid_mock = MagicMock(return_value = fake_hybrid_results)
    monkeypatch.setattr(
        pipeline,
        "run_hybrid_search_pipeline",
        hybrid_mock
    )

    fake_ranking_results = [
        RetrievedResult(rank=1, score=1, post_id=1, chunk_idx=1, title="fake_reranking_1", slug="fr1", content="fake_reranking_1_content", heading_path=["fr1"]),
        RetrievedResult(rank=2, score=0.5, post_id=1, chunk_idx=2, title="fake_reranking_2", slug="fr2", content="fake_reranking_2_content", heading_path=["fr2"]),
    ]
    ranking_mock = AsyncMock(return_value=fake_ranking_results)
    monkeypatch.setattr(
        pipeline,
        "generate_reranking_retrieved_results",
        ranking_mock
    )

    fake_prompt = "fake prompt"
    prompt_mock = MagicMock(return_value = fake_prompt)
    monkeypatch.setattr(
        pipeline.answer_prompt,
        "build_prompt",
        prompt_mock
    )

    result = await pipeline.run_rag_pipeline(query=query, embedding_model=embedding_model, reranking_model=reranking_model, generation_model=generation_model,
                                              bm25=bm25, post_chunk_ids=post_chunks, db=db, request_id=request_id)

    hybrid_mock.assert_called_once_with(fake_dense_results, fake_lexical_results)
    ranking_mock.assert_awaited_once_with(query= query, retrieved_results=fake_hybrid_results, model=reranking_model)
    prompt_mock.assert_called_once_with(user_query=query, retrieved_results=fake_ranking_results)
    generation_model.generate_answer.assert_awaited_once_with(prompt=fake_prompt, rules=pipeline.answer_prompt.rules)
    assert result.generated_answer == fake_generated_answer


