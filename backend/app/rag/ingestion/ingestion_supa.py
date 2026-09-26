from sqlalchemy.orm import selectinload
from sqlalchemy import select, delete
import asyncio
from sentence_transformers import SentenceTransformer
import re
from transformers import PreTrainedTokenizerBase
from pathlib import Path
import sys
import argparse

CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent.parent.parent
sys.path.append(str(BACKEND_DIR))

from app.db.session import AsyncSessionLocal
from app.db.models import Post, PostChunk
from app.rag.config import EMBEDDING_CONFIG, CHUNKING_CONFIG

# re patterns for generating sections
heading_pattern = re.compile(r"^(#{1,6})\s+(.+)$")
coding_pattern = re.compile(r"^(`{3})\s*")

async def getPosts() -> list[Post]:
    async with AsyncSessionLocal() as db:
        posts = (await db.scalars(select(Post).options(selectinload(Post.tags)))).all()
        return list(posts)

# for updating post chunks that the postchunk has been ingested
async def getPost(post_id: int) -> Post:
    async with AsyncSessionLocal() as db:
        post: Post | None = await db.get(Post, post_id, options=[selectinload(Post.tags)])

        if post is None:
            raise ValueError(f"Post {post_id} not found")
        
        return post

def generate_sections(post: Post) -> list[tuple[list[str], str]]:
    """
    Logic: split the content into lines
    if line is in coding block, add the line and continue
    if the line is heading, checking whether there is content or not:
        if yes: it's the start of the next section, so add (heading_path, content) 
                and set the current one as heading_path
        else:
            just add the line to the content
    flush after for loop ends
    
    """
    sections = []
    coding_flag = False
    heading_list = [None] * 6
    content_lines = []

    lines = post.content_md.splitlines(keepends=False)
    for line in lines:
        # coding flag has higher priority than content so # in coding block can be kept
        if coding_pattern.match(line):
            coding_flag = not coding_flag
            content_lines.append(line)
            continue
        if coding_flag:
            content_lines.append(line)
            continue

        match = heading_pattern.match(line)
        if match:
            current_path = [heading for heading in heading_list if heading is not None]
            content = "\n".join(content_lines).strip()
            if content:
                sections.append((current_path, content))
            
            heading_level = len(match.group(1))
            heading_content = match.group(2)
            heading_list[heading_level - 1] = heading_content
            # For the next heading
            heading_list[heading_level:] = [None] * (len(heading_list) - heading_level)
            # Reset content lines
            content_lines = []
        else:
            content_lines.append(line)

    # flush at the end of the content
    current_path = [heading for heading in heading_list if heading is not None]
    content = "\n".join(content_lines).strip()
    if content:
        sections.append((current_path, content))

    return sections
    
def get_post_with_sections_from_posts(posts: list[Post]) -> list[tuple[Post, list[tuple[list[str], str]]]]: # return as [Post, post's sections as tuple]
    post_with_sections = []
    for post in posts:
        sections = generate_sections(post=post)        
        post_with_sections.append((post, sections))    
    return post_with_sections

def generate_post_chunks(post: Post, sections: list[tuple[list[str], str]], model: SentenceTransformer, 
                       max_seq_length:int, chunk_overlap: int) -> list[PostChunk]:
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
    tokenizer: PreTrainedTokenizerBase = model.tokenizer
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
                combined_embedding = model.encode(heading_text + "\n" + content_text).tolist()
                chunk = PostChunk(post_id=post.id, chunk_idx=chunk_idx, content_chunk=content_text, combined_embedding=combined_embedding,
                                  heading_path=heading_path)
                chunk_idx += 1
                post_chunks.append(chunk)
                if i + content_budget >= len(content_encoded):
                    break
        else:
            combined_embedding = model.encode(heading_text + "\n" + content).tolist()
            chunk = PostChunk(post_id=post.id, chunk_idx=chunk_idx, content_chunk=content, combined_embedding=combined_embedding,
                                              heading_path=heading_path)
            chunk_idx += 1
            post_chunks.append(chunk)
    return post_chunks

def generate_all_post_chunks(posts: list[Post], model: SentenceTransformer, max_seq_length: int, chunk_overlap: int) -> list[PostChunk]:
    post_chunks: list[PostChunk] = []
    for post in posts:
        sections = generate_sections(post=post)
        post_chunks += generate_post_chunks(post=post, sections=sections, model=model, max_seq_length=max_seq_length, chunk_overlap=chunk_overlap)
    return post_chunks

async def ingest_one(post_id: int):
    post = await getPost(post_id=post_id)
    stmt = delete(PostChunk).where(PostChunk.post_id == post_id)

    sections = generate_sections(post=post)
    model = SentenceTransformer(EMBEDDING_CONFIG.model_name)
    max_seq_length = CHUNKING_CONFIG.max_seq_length
    chunk_overlap = CHUNKING_CONFIG.chunk_overlap
    post_chunks: list[PostChunk] = generate_post_chunks(post=post, sections=sections, model=model, max_seq_length=max_seq_length, chunk_overlap=chunk_overlap)

    async with AsyncSessionLocal() as db:
        await db.execute(stmt)
        db.add_all(post_chunks)
        await db.commit()

async def ingest_all():
    posts = await getPosts()
    stmt = delete(PostChunk)

    model = SentenceTransformer(EMBEDDING_CONFIG.model_name)
    max_seq_length = CHUNKING_CONFIG.max_seq_length
    chunk_overlap = CHUNKING_CONFIG.chunk_overlap
    post_chunks: list[PostChunk] = generate_all_post_chunks(posts=posts, model=model, max_seq_length=max_seq_length, chunk_overlap=chunk_overlap)

    async with AsyncSessionLocal() as db:
        await db.execute(stmt)
        db.add_all(post_chunks)
        await db.commit()

async def delete_post_chunks(post_id: int):
    stmt = delete(PostChunk).where(PostChunk.post_id == post_id)
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

