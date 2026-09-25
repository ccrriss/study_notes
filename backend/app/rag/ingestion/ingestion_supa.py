from sqlalchemy.orm import selectinload
from sqlalchemy import select
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

parser = argparse.ArgumentParser()
parser.add_argument("--post-id", type=int, default=None)

args = parser.parse_args()
print(args.post_id)

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
        post: Post | None = await db.get(Post, post_id, options=[selectinload(Post.tags), selectinload(Post.post_chunks)])

        if post is None:
            raise ValueError(f"Post {post_id} not found")
        
        return post

def generate_sections(post: Post) -> list[tuple[list[str], str]]:
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

def generate_postChunk(post: Post, sections: list[tuple[list[str], str]], model: SentenceTransformer, 
                       max_seq_length:int, chunk_overlap: int) -> PostChunk:
    tokenizer: PreTrainedTokenizerBase = model.tokenizer
    special_tokens = tokenizer.num_special_tokens_to_add(pair=False)

    post_chunks = []
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

        if len(content_encoded) > len(content_budget):
            for i in range(0, len(content_encoded) - content_budget, step_size):
                content = content_encoded[i: i+content_budget]
        # unfinished yet

def preprocessing_post_with_sections_and_ingest(post_with_sections: list[tuple[Post, list[tuple[list[str], str]]]], model: SentenceTransformer, 
                      max_seq_length:int, chunk_overlap: int) -> list[PostChunk]:
    tokenizer: PreTrainedTokenizerBase = model.tokenizer
    special_tokens = tokenizer.num_special_tokens_to_add(pair=False)

    post_chunks = []
    for post, sections in post_with_sections:
        chunk_idx = 0

        for heading_path, content in sections:
            heading_text = " > ".join(heading_path).strip()
            
            heading_path_encoded = tokenizer.encode(heading_text, add_special_tokens=False)
            content_encoded = tokenizer.encode(content, add_special_tokens=False, verbose=False)

            content_budget = max_seq_length - special_tokens - len(heading_path_encoded) - 2 # safety margin for "\n" so -2

            if content_budget <= chunk_overlap:
                raise ValueError(
                    "heading path is too long for the token budget"
                )

            step_size = content_budget - chunk_overlap

            # if the length of content_encoded is small just add it, or split if the len is large
            if len(content_encoded) > content_budget:
                for i in range(0, len(content_encoded), step_size):
                    content_chunk = content_encoded[i: i + content_budget]
                    content_text = tokenizer.decode(content_chunk)
                    
                    combined_embedding = model.encode(heading_text + "\n" + content_text).tolist()

                    chunk = PostChunk(post_id=post.id, chunk_idx=chunk_idx, 
                                      content_chunk=content_text,
                                      combined_embedding=combined_embedding, heading_path=heading_path) 
                    chunk_idx += 1
                    post_chunks.append(chunk)
                    if i + content_budget >= len(content_encoded):
                        break
            else:
                combined_embedding = model.encode(heading_text + "\n" + content).tolist()

                chunk = PostChunk(post_id=post.id, chunk_idx=chunk_idx, 
                                content_chunk=content,
                                combined_embedding=combined_embedding, heading_path=heading_path)  
                chunk_idx += 1
                post_chunks.append(chunk) 
                
    return post_chunks

async def ingestion():
    model = SentenceTransformer(EMBEDDING_CONFIG.model_name)

    posts = await getPosts()
    post_with_sections = get_post_with_sections_from_posts(posts)
    post_chunks = preprocessing_post_with_sections_and_ingest(post_with_sections, model=model, 
                                        max_seq_length=CHUNKING_CONFIG.max_seq_length, chunk_overlap=CHUNKING_CONFIG.chunk_overlap)

    async with AsyncSessionLocal() as db:
        db.add_all(post_chunks)
        await db.commit()

# asyncio.run(ingestion())
