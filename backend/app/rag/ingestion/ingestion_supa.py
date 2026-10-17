from sqlalchemy import delete
import asyncio
from sentence_transformers import SentenceTransformer
from pathlib import Path
import sys
import argparse

"""
ingetstion_supa is for local use only that generate the postchunks to the supabase database

also including methods for local testing

"""

CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent.parent.parent
sys.path.append(str(BACKEND_DIR))

from app.db.session import AsyncSessionLocal
from app.db.models import PostChunk, Post
from app.rag.config import EMBEDDING_CONFIG, CHUNKING_CONFIG
from app.rag.ingestion.post_chunks import getPost, generate_sections, getPosts

from transformers import PreTrainedTokenizerBase
from sqlalchemy import delete

def generate_post_chunks(post: Post, sections: list[tuple[list[str], str]], tokenizer: PreTrainedTokenizerBase, 
                       model: SentenceTransformer, max_seq_length:int, chunk_overlap: int) -> list[PostChunk]:
    """
    Logic: one post -> many sections with different (heading_path, content)
    Calculate the content budget first:
        content_budget = max_seq_length - special_tokens - len(heading_path_encoded) - 2(# safety margin for separator/newline)
        then calculate step_size:
            step_size = content_budget - chunk_overlap

    check whether the len of encoded content is larger than budget:
        if true: loop and tokenize each part, then decode for generating embedding with heading_path+content
        false: use the content and heading_path to generate embedding
    """
    special_tokens = tokenizer.num_special_tokens_to_add(pair=False)

    post_chunks: list[PostChunk] = []
    chunk_idx = 0
    for heading_path, content in sections:
        heading_text = " > ".join(heading_path).strip()

        heading_path_encoded = tokenizer.encode(heading_text, add_special_tokens=False)
        content_encoded = tokenizer.encode(content, add_special_tokens=False, verbose=False)

        content_budget = max_seq_length - special_tokens - len(heading_path_encoded) - 2

        if content_budget <= chunk_overlap:
            raise ValueError(
                "heading path is too long for the token budget"
            )

        step_size = content_budget - chunk_overlap

        if len(content_encoded) > content_budget:
            for i in range(0, len(content_encoded), step_size):
                content_chunk = content_encoded[i: i+content_budget]
                content_text = tokenizer.decode(content_chunk)
                combined_embedding = model.encode(heading_text + "\n" + content_text)
                chunk = PostChunk(post_id=post.id, chunk_idx=chunk_idx, content_chunk=content_text, combined_embedding=combined_embedding,
                                  heading_path=heading_path)
                chunk_idx += 1
                post_chunks.append(chunk)
                if i + content_budget >= len(content_encoded):
                    break
        else:
            combined_embedding = model.encode(heading_text + "\n" + content)
            chunk = PostChunk(post_id=post.id, chunk_idx=chunk_idx, content_chunk=content, combined_embedding=combined_embedding,
                                              heading_path=heading_path)
            chunk_idx += 1
            post_chunks.append(chunk)
    return post_chunks

def generate_all_post_chunks(posts: list[Post], model: SentenceTransformer, tokenizer: PreTrainedTokenizerBase) -> list[PostChunk]:
    post_chunks: list[PostChunk] = []
    max_seq_length = CHUNKING_CONFIG.max_seq_length
    chunk_overlap = CHUNKING_CONFIG.chunk_overlap
    for post in posts:
        sections = generate_sections(post=post)
        post_chunks += generate_post_chunks(post=post, sections=sections, tokenizer=tokenizer, 
                                                  model=model, max_seq_length=max_seq_length, chunk_overlap=chunk_overlap)
    return post_chunks

async def ingest_one(post_id: int):
    model = SentenceTransformer(EMBEDDING_CONFIG.model_name)
    stmt = delete(PostChunk).where(PostChunk.post_id==post_id)
    async with AsyncSessionLocal() as db:
        post = await getPost(post_id=post_id, db=db)
        sections = generate_sections(post=post)
        post_chunks = generate_post_chunks(post=post, sections=sections, tokenizer=model.tokenizer, model=model, 
                                           max_seq_length=CHUNKING_CONFIG.max_seq_length, chunk_overlap=CHUNKING_CONFIG.chunk_overlap)
        await db.execute(stmt)
        
        db.add_all(post_chunks)
        await db.commit()

async def ingest_all():
    model = SentenceTransformer(EMBEDDING_CONFIG.model_name)
    tokenizer = model.tokenizer

    async with AsyncSessionLocal() as db:
        posts = await getPosts(db=db)
        post_chunks: list[PostChunk] = generate_all_post_chunks(posts=posts, model=model, tokenizer=tokenizer)
        await db.delete(PostChunk)
        db.add_all(post_chunks)
        await db.commit()

async def delete_post_chunks(post_id: int):
    stmt = delete(PostChunk).where(PostChunk.post_id==post_id)
    async with AsyncSessionLocal() as db:
        await db.execute(stmt)
        await db.commit()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--post-id", type=int, default=None)
    parser.add_argument("--delete-post-id", type=int, default=None)

    args = parser.parse_args()
    if args.delete_post_id is not None:
        asyncio.run(delete_post_chunks(args.delete_post_id))
    elif args.post_id is None:
        asyncio.run(ingest_all())
    else:
        asyncio.run(ingest_one(args.post_id))

