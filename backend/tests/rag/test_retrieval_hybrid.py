from app.schemas.evaluation import RetrievedResult
from app.rag.retrieval_hybrid import fuse_hybrid_retrieval_results
import pytest

def build_retrieval_results():
    dense_A: RetrievedResult = RetrievedResult(rank=1, score=1, post_id=1, chunk_idx=1, title="1", slug="1", heading_path=["1"], content="1")
    dense_B: RetrievedResult = RetrievedResult(rank=2, score=0.5, post_id=1, chunk_idx=2, title="2", slug="2", heading_path=["2"], content="2")
    lexical_C: RetrievedResult = RetrievedResult(rank=1, score=1, post_id=2, chunk_idx=1, title="3", slug="3", heading_path=["3"], content="3")
    lexical_A: RetrievedResult = RetrievedResult(rank=2, score=0.3, post_id=1, chunk_idx=1, title="1", slug="1", heading_path=["1"], content="1")

    dense_results = [dense_A, dense_B]
    lexical_results = [lexical_C, lexical_A]

    return dense_results, lexical_results

"""
Arrange: dense_results and lexical_resutls. And top_k
Act: fuse_hybrid_retrieval_results
Assert: The score, and the post_id, chunk_idx are expected or not
        The results' length of top_k
"""
def test_retrieval_hybrid():
    dense_results, lexical_results = build_retrieval_results()
    hybrid_results = fuse_hybrid_retrieval_results(dense_results=dense_results, lexical_results=lexical_results, top_k=3)
    assert (hybrid_results[0].post_id, hybrid_results[0].chunk_idx) == (dense_results[0].post_id, dense_results[0].chunk_idx)
    assert (hybrid_results[1].post_id, hybrid_results[1].chunk_idx) == (lexical_results[0].post_id, lexical_results[0].chunk_idx)
    assert (hybrid_results[2].post_id, hybrid_results[2].chunk_idx) == (dense_results[1].post_id, dense_results[1].chunk_idx)

    assert(hybrid_results[0].score == pytest.approx(1/61 + 1/62))
    assert(hybrid_results[1].score == pytest.approx(1/61))
    assert(hybrid_results[2].score == pytest.approx(1/62))

    assert(hybrid_results[0].rank == 1)
    assert(hybrid_results[1].rank == 2)
    assert(hybrid_results[2].rank == 3)

    assert(dense_results[0].score == 1)
    assert(lexical_results[1].score == 0.3)

    assert(dense_results[0].rank == 1)
    assert(lexical_results[1].rank == 2)

def test_retrieval_hybrid_top_k():
    dense_results, lexical_results = build_retrieval_results()
    hybrid_results = fuse_hybrid_retrieval_results(dense_results=dense_results, lexical_results=lexical_results, top_k=2)
    assert (len(hybrid_results) == 2)
    assert (hybrid_results[0].post_id, hybrid_results[0].chunk_idx) == (dense_results[0].post_id, dense_results[0].chunk_idx)
    assert (hybrid_results[1].post_id, hybrid_results[1].chunk_idx) == (lexical_results[0].post_id, lexical_results[0].chunk_idx)