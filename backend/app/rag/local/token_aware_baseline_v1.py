"""
This file is for local dev. 
It was the first chunking method and tested but then was changed to md-aware
"""

from sqlalchemy.orm import selectinload
from sqlalchemy import select, text
import asyncio
from pathlib import Path
import sys
from sentence_transformers import SentenceTransformer
from backend.app.rag.local.models import PostChunk, RagBase

CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent.parent
sys.path.append(str(BACKEND_DIR))

from app.db.session import AsyncSessionLocal, Rag_AsyncSessionLocal, rag_engine
from app.db.models import Post
from transformers import PreTrainedTokenizerBase

# copied from app.api.rag
content_chunk_size = 100
chunk_overlap = 8
step_size = content_chunk_size - chunk_overlap

model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
tokenizer: PreTrainedTokenizerBase = model.tokenizer

async def getPosts():
    async with AsyncSessionLocal() as db:
        posts = (await db.scalars(select(Post).options(selectinload(Post.tags)))).all()
        return posts

async def get_chunks() -> list[PostChunk] :
    posts = await getPosts()
    chunks = preprocessing_data(posts)
    return chunks

def preprocessing_data(posts: list[Post], max_seq_length=128) -> list[PostChunk]:
    chunks = []
    special_tokens = tokenizer.num_special_tokens_to_add(pair=False)
    metadata_budget = max_seq_length - content_chunk_size - special_tokens

    for post in posts:
        token_ids = tokenizer.encode(post.content_md, add_special_tokens=False, verbose=False)
        chunk_idx = 0
        title = f"Title: {post.title}\n"
        tags = [tag.name for tag in post.tags]
        tag_names = f"Tags: {', '.join(tags)}\n"
        title_tag_token_ids = tokenizer.encode(title + tag_names, add_special_tokens=False)[:metadata_budget]

        for i in range(0, len(token_ids), step_size):
            content_chunk = token_ids[i: i+content_chunk_size]

            combined_chunk = title_tag_token_ids + content_chunk

            content_chunk = tokenizer.decode(content_chunk)
            combined_chunk = tokenizer.decode(combined_chunk)

            embedding = model.encode(content_chunk).tolist()
            combined_embedding = model.encode(combined_chunk).tolist()

            chunk = PostChunk(post_id=post.id, chunk_idx=chunk_idx, title=post.title, slug=post.slug, 
                              content_chunk=content_chunk, tags=tags, embedding=embedding, combined_embedding=combined_embedding)
            
            chunks.append(chunk)
            chunk_idx += 1

    return chunks