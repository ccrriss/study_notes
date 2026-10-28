import pytest
from app.rag.retrieval_lexical import build_bm25_index
from app.db.models import PostChunk, Post
import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from app.rag.pipeline import run_lexical_search_pipeline
from app.schemas.evaluation import RetrievedResult

TEST_DATABASE_URL = os.getenv(key="TEST_DATABASE_URL", default="postgresql+asyncpg://postgres:postgres@localhost:5433/study_notes_test")

test_db_engine = create_async_engine(
    url=TEST_DATABASE_URL,
    echo=False,
    connect_args = {"ssl": False},
    poolclass = NullPool
)

TestSessionLocal = async_sessionmaker(
    test_db_engine, expire_on_commit=False
)

test_post = Post(title="test title", slug="test slug", content_md="test content", excerpt="test_excerpt")



def create_post_chunks(post: Post):
    postchunk_a = PostChunk(
        post_id=post.id,
        chunk_idx=0,
        content_chunk="Python isinstance ...",
        combined_embedding=[0.0] * 384,
        heading_path=["Python"]
    )
    postchunk_b = PostChunk(
        post_id=post.id,
        chunk_idx=1,
        content_chunk="NEXT_PUBLIC environment variable ...",
        combined_embedding=[0.0] * 384,
        heading_path=["Next.js"]
    )

    postchunk_c = PostChunk(
        post_id=post.id,
        chunk_idx=2,
        content_chunk="engine.begin transaction ...",
        combined_embedding=[0.0] * 384,
        heading_path=["SQLAlchemy"]
    )

    return postchunk_a, postchunk_b, postchunk_c

query = "NEXT_PUBLIC"

@pytest.mark.anyio
async def test_lexical_integration():
    async with TestSessionLocal() as db:
        db.add(test_post)
        await db.flush()

        postchunk_a, postchunk_b, postchunk_c = create_post_chunks(test_post)
        db.add_all([postchunk_a, postchunk_b, postchunk_c])
        await db.flush()

        bm25, inverted_idx_dict , post_chunk_ids = await build_bm25_index(db=db)
        
        lexical_results: list[RetrievedResult] = await run_lexical_search_pipeline(query=query, bm25=bm25, inverted_idx_dict=inverted_idx_dict, 
                                    post_chunk_ids=post_chunk_ids, db=db)

        assert len(lexical_results) == 1
        assert lexical_results[0].rank == 1
        assert lexical_results[0].post_id == test_post.id
        assert lexical_results[0].chunk_idx == postchunk_b.chunk_idx
        assert lexical_results[0].content == postchunk_b.content_chunk
        assert lexical_results[0].title == test_post.title
        