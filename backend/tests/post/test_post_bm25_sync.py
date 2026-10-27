import pytest
import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from app.db.models import Post, PostChunk
from app.rag.retrieval_lexical import build_bm25_index, calculate_all_bm25_scores
from sqlalchemy import select
from app.rag.ingestion.post_chunks import add_post_chunks, refresh_post_chunks

"""
Arrange:
- create a post containing a unique old token
- prepare old_query
- prepare new_query

Act:
1. create the post and its PostChunks
2. rebuild BM25
3. update the post content to the new token
4. refresh PostChunks
5. rebuild BM25
6. delete the post
7. rebuild BM25

Assert:
create:
- old query should have a positive BM25 score for the created PostChunk

update:
- old query score for the updated PostChunk should be 0
- new query score should be positive

delete:
- the deleted PostChunk should no longer exist in post_chunk_ids

"""

TEST_DATABASE_URL = os.getenv(key="TEST_DATABASE_URL", default="postgresql+asyncpg://postgres:postgres@localhost:5433/study_notes_test")

class FakeEmbeddingProvider:
    async def chunk_and_embed(self, sections, max_seq_length, chunk_overlap):
        result = []

        for heading_path, content in sections:
            # embedding doesn't matter since it's for lexical search only
            embedding = [1.0] + [0.0] * 383
            result.append(
                (heading_path,
                 [(content, embedding)])
            )
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

query_old = "bm25_refresh_probe_old"
query_new = "bm25_refresh_probe_new"

def create_posts() -> tuple[Post, Post, Post]:
    target_post = Post(
    title="target",
    slug="target-test",
    content_md=query_old,
    excerpt="target"
)
    control_post_1 = Post(
    title="control 1",
    slug="control-test-1",
    content_md="unrelated_alpha_content",
    excerpt="control"
    )
    control_post_2 = Post(
        title="control 2",
        slug="control-test-2",
        content_md="unrelated_beta_content",
        excerpt="control"
    )

    return target_post, control_post_1, control_post_2

@pytest.mark.anyio
async def test_bm25_sync_after_create():
    target_post, control_post_1, control_post_2 = create_posts()
    posts = [target_post, control_post_1, control_post_2]
    async with TestSessionLocal() as db:
        db.add_all(posts)
        await db.flush()
        for post in posts:
            await add_post_chunks(post=post, db=db, model=FakeEmbeddingProvider())
        await db.flush()

        stmt = select(PostChunk).where(PostChunk.post_id == target_post.id)
        results = await db.scalars(stmt)
        post_chunks = results.all()

        assert len(post_chunks) > 0

        bm25, inverted_index_dict, post_chunk_ids = await build_bm25_index(db=db)
        scores = calculate_all_bm25_scores(bm25=bm25, query=query_old)

        max_score = 0
        for post_chunk in post_chunks:
            idx_in_post_chunk_ids = post_chunk_ids.index(post_chunk.id)
            max_score = max(max_score, scores[idx_in_post_chunk_ids])
            
        assert max_score > 0
        assert max_score == max(scores)

@pytest.mark.anyio
async def test_bm25_sync_after_update():
    target_post, control_post_1, control_post_2 = create_posts()
    posts = [target_post, control_post_1, control_post_2]
    async with TestSessionLocal() as db:
        db.add_all(posts)
        await db.flush()

        for post in posts:
            await add_post_chunks(db=db, post=post, model=FakeEmbeddingProvider())
        await db.flush()

        # before updating check the scores
        stmt = select(PostChunk).where(PostChunk.post_id == target_post.id)
        results  = await db.scalars(stmt)
        post_chunks = results.all()

        assert len(post_chunks) > 0

        bm25, inverted_index_dict, post_chunk_ids = await build_bm25_index(db=db)
        old_scores = calculate_all_bm25_scores(bm25=bm25, query=query_new)

        old_max_score = 0
        for post_chunk in post_chunks:
            idx_in_post_chunk_ids = post_chunk_ids.index(post_chunk.id)
            old_max_score = max(old_max_score, old_scores[idx_in_post_chunk_ids])

        old_chunk_ids = {post_chunk.id for post_chunk in post_chunks}

        # update the content
        target_post.content_md = query_new      
        await db.flush()

        await refresh_post_chunks(post=target_post , db=db, model=FakeEmbeddingProvider())
        await db.flush()

        # after updating check the scores
        stmt = select(PostChunk).where(PostChunk.post_id == target_post.id)
        results  = await db.scalars(stmt)
        post_chunks = results.all()

        bm25, inverted_index_dict, post_chunk_ids = await build_bm25_index(db=db)
        new_scores = calculate_all_bm25_scores(bm25=bm25, query=query_new)
        new_max_score = 0
        for post_chunk in post_chunks:
            idx_in_post_chunk_ids = post_chunk_ids.index(post_chunk.id)
            new_max_score = max(new_max_score, new_scores[idx_in_post_chunk_ids])

        new_chunk_ids = {post_chunk.id for post_chunk in post_chunks}

        assert old_chunk_ids.isdisjoint(new_chunk_ids)
        
        assert new_max_score > old_max_score
        assert new_max_score > 0
        assert new_max_score == max(new_scores)

@pytest.mark.anyio
async def test_bm25_sync_after_delete():
    target_post, control_post_1, control_post_2 = create_posts()
    posts = [target_post, control_post_1, control_post_2]
    async with TestSessionLocal() as db:
        db.add_all(posts)
        await db.flush()

        for post in posts:
            await add_post_chunks(post=post, db=db, model=FakeEmbeddingProvider())
        await db.flush()

        # check the scores before delete the post
        stmt = select(PostChunk).where(PostChunk.post_id == target_post.id)
        results = await db.scalars(stmt)
        post_chunks = results.all()

        target_chunk_ids = {post_chunk.id for post_chunk in post_chunks}

        await db.delete(target_post)
        await db.flush()

        # after delete
        bm25, inverted_index_dict, post_chunk_ids = await build_bm25_index(db=db)

        assert target_chunk_ids.isdisjoint(post_chunk_ids)

        results = await db.scalars(stmt)
        remaining_target_chunks = results.all()

        assert len(remaining_target_chunks) == 0
