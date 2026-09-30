import pytest
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import text, select
from sqlalchemy.pool import NullPool
from app.db.models import Post, PostChunk
from app.rag.retrieval_dense import retrieve_dense_chunks
import os

TEST_DATABASE_URL = os.getenv(key="TEST_DATABASE_URL", default="postgresql+asyncpg://postgres:postgres@localhost:5433/study_notes_test")

class FakeEmbeddingProvider:
    async def encode(self, text:str) -> list[float]:
        result = [0] * 384
        result[0] = 1.0
        return result

test_db_engine = create_async_engine(
    url=TEST_DATABASE_URL,
    echo=False,
    connect_args = {"ssl": False},
    poolclass = NullPool
)

TestSessionLocal = async_sessionmaker(
    test_db_engine, expire_on_commit=False
)



@pytest.mark.anyio
async def test_docker_db():
    async with TestSessionLocal() as db:
        stmt = text("SELECT current_database();")
        result = await db.execute(stmt)
        database_name = result.scalar_one()
        assert database_name == "study_notes_test"
"""
Arrange: prepare post, postchunks, fakeembeddingprovider
act: retrieve_dense_chunks
assert: check ranking and cos_similarity
"""
@pytest.mark.anyio
async def test_integration_dense_retrieval():
    test_post = Post(title="test title", slug="test slug", content_md="test content", excerpt="test excerpt")
    test_post_chunks = [
        PostChunk(post_id=1, chunk_idx=0, content_chunk="test post chunk 1", combined_embedding=([0]*384), heading_path=["test heading 1"]),
        PostChunk(post_id=1, chunk_idx=1, content_chunk="test post chunk 2", combined_embedding=([0]*384), heading_path=["test heading 2"]),
        PostChunk(post_id=1, chunk_idx=2, content_chunk="test post chunk 3", combined_embedding=([0]*384), heading_path=["test heading 3"]),
    ]
    test_post_chunks[0].combined_embedding[0] = 1.0
    test_post_chunks[1].combined_embedding[0], test_post_chunks[1].combined_embedding[1] = 0.8, 0.2
    test_post_chunks[2].combined_embedding[0], test_post_chunks[2].combined_embedding[1] = 0.5, 0.5

    async with TestSessionLocal() as db:
        db.add(test_post)
        await db.flush()
        for post_chunk in test_post_chunks:
            post_chunk.post_id = test_post.id
            db.add(post_chunk)
        await db.flush()
        results = await retrieve_dense_chunks(query="test query", db=db, embedding_model=FakeEmbeddingProvider(), top_k=3)
        # results are list[tuple[PostChunk, cos_similarity]]
        assert results[0][0].chunk_idx == 0
        assert results[1][0].chunk_idx == 1
        assert results[2][0].chunk_idx == 2
        assert results[0][1] > results[1][1]
        assert results[1][1] > results[2][1]
        assert len(results) == 3