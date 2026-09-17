import app.rag.pipeline as pipeline
from unittest.mock import AsyncMock, MagicMock
import pytest

query = "test query"
embedding_model = MagicMock()
bm25 = MagicMock()
post_chunks = [1, 2]
db = MagicMock()

@pytest.mark.anyio
async def test_run_rag_pipeline(monkeypatch):
    fake_dense_results = [
        "dense_A",
        "dense_B"
    ]
    dense_mock = AsyncMock(return_value=fake_dense_results)
    monkeypatch.setattr(
        pipeline,
        "run_dense_search_pipeline",
        dense_mock
    )

    fake_lexical_results = [
        "lexical_B",
        "lexical_C"
    ]
    lexical_mock = AsyncMock(return_value=fake_lexical_results)
    monkeypatch.setattr(
        pipeline,
        "run_lexical_search_pipeline",
        lexical_mock
    )

    fake_hybrid_results = [
        "hybrid_B",
        "hybrid_C"
    ]
    hybrid_mock = MagicMock(return_value = fake_hybrid_results)
    monkeypatch.setattr(
        pipeline,
        "run_hybrid_search_pipeline",
        hybrid_mock
    )

    fake_ranking_results = [
        "ranking_B",
        "ranking_C"
    ]
    ranking_mock = MagicMock(return_value=fake_ranking_results)
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

    fake_generated_answer = "fake generated answer"
    answer_mock = AsyncMock(return_value = fake_generated_answer)
    monkeypatch.setattr(
        pipeline,
        "generate_answer",
        answer_mock
    )

    result = await pipeline.run_rag_pipeline(query=query, embedding_model=embedding_model, bm25=bm25, post_chunk_ids=post_chunks, db=db)

    hybrid_mock.assert_called_once_with(fake_dense_results, fake_lexical_results)
    ranking_mock.assert_called_once_with(query= query, retrieved_results=fake_hybrid_results)
    prompt_mock.assert_called_once_with(user_query=query, retrieved_results=fake_ranking_results)
    answer_mock.assert_awaited_once_with(prompt=fake_prompt, rules=pipeline.answer_prompt.rules)
    assert result["generated_answer"] == fake_generated_answer


