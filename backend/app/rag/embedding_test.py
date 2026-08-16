from sqlalchemy.orm import selectinload
from sqlalchemy import select
import asyncio
from pathlib import Path
import sys
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from models import PostChunk, RagBase

CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent.parent
sys.path.append(str(BACKEND_DIR))

from app.db.session import AsyncSessionLocal, Rag_AsyncSessionLocal, rag_engine
from app.db.models import Post

# copied from app.api.rag
chunk_size = 100
chunk_overlap = 8
step_size = chunk_size - chunk_overlap

model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

def preprocessing_data(posts: list[Post]):
    chunks = []
    for post in posts:
        chunk_idx = 0
        tags = [tag.name for tag in post.tags]

        for i in range(0, len(post.content_md), step_size):
            content_chunk = post.content_md[i: i+chunk_size]

            data = {
                "post_id": post.id,
                "chunk_idx": chunk_idx,
                "title": post.title,
                "slug": post.slug,
                "content_chunk": content_chunk,
                "tags": tags
            }
            chunks.append(data)
            chunk_idx += 1

    return chunks

async def getPosts():
    async with AsyncSessionLocal() as db:
        posts = (await db.scalars(select(Post).options(selectinload(Post.tags)))).all()
        print(posts)

async def create_table():   
    async with rag_engine.begin() as rag_conn:
        await rag_conn.run_sync(RagBase.metadata.create_all)
    print("rag tables are created")

    yield

    await rag_engine.dispose()
    print("database engine disposed")

async def create_pgvector():
    # pgvector extension
    create_db_text = ("CREATE EXTENSION IF NOT EXISTS vector;")
    async with Rag_AsyncSessionLocal() as rag_db:
        rag_db.execute(create_db_text)

# asyncio.run(getPosts())