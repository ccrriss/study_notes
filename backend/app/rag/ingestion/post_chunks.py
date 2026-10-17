from app.db.models import Post, PostChunk
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, delete
from app.rag.provider_protocols import EmbeddingProvider
from app.rag.config import CHUNKING_CONFIG
from transformers import PreTrainedTokenizerBase
import re

# for updating post chunks that the postchunk has been ingested
async def getPost(post_id: int, db: AsyncSession) -> Post:
    post: Post | None = await db.get(Post, post_id, options=[selectinload(Post.tags)])
    if post is None:
        raise ValueError(f"Post {post_id} not found")
    
    return post

async def getPosts(db: AsyncSession) -> list[Post]:
    stmt = select(Post).options(selectinload(Post.tags))
    results = (await db.scalars(stmt))
    posts = results.all()
    return list(posts)


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
    # re patterns for generating sections
    heading_pattern = re.compile(r"^(#{1,6})\s+(.+)$")
    coding_pattern = re.compile(r"^(`{3})\s*")

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

async def generate_post_chunks(post: Post, sections: list[tuple[list[str], str]], tokenizer: PreTrainedTokenizerBase, 
                       model: EmbeddingProvider, max_seq_length:int, chunk_overlap: int) -> list[PostChunk]:
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
                combined_embedding = await model.encode(heading_text + "\n" + content_text)
                chunk = PostChunk(post_id=post.id, chunk_idx=chunk_idx, content_chunk=content_text, combined_embedding=combined_embedding,
                                  heading_path=heading_path)
                chunk_idx += 1
                post_chunks.append(chunk)
                if i + content_budget >= len(content_encoded):
                    break
        else:
            combined_embedding = await model.encode(heading_text + "\n" + content)
            chunk = PostChunk(post_id=post.id, chunk_idx=chunk_idx, content_chunk=content, combined_embedding=combined_embedding,
                                              heading_path=heading_path)
            chunk_idx += 1
            post_chunks.append(chunk)
    return post_chunks

async def build_post_chunks(post: Post, sections: list[tuple[list[str], str]], tokenizer: PreTrainedTokenizerBase, model: EmbeddingProvider) -> list[PostChunk]:
    max_seq_length = CHUNKING_CONFIG.max_seq_length
    chunk_overlap = CHUNKING_CONFIG.chunk_overlap
    post_chunks: list[PostChunk] = await generate_post_chunks(post=post, sections=sections, tokenizer=tokenizer,
                                                        model=model, max_seq_length=max_seq_length, chunk_overlap=chunk_overlap)
    return post_chunks

async def generate_all_post_chunks(posts: list[Post], model: EmbeddingProvider, tokenizer: PreTrainedTokenizerBase) -> list[PostChunk]:
    post_chunks: list[PostChunk] = []
    max_seq_length = CHUNKING_CONFIG.max_seq_length
    chunk_overlap = CHUNKING_CONFIG.chunk_overlap
    for post in posts:
        sections = generate_sections(post=post)
        post_chunks += await generate_post_chunks(post=post, sections=sections, tokenizer=tokenizer, 
                                                  model=model, max_seq_length=max_seq_length, chunk_overlap=chunk_overlap)
    return post_chunks

async def delete_post_chunks_by_post_id(post_id: int, db: AsyncSession):
    stmt = delete(PostChunk).where(PostChunk.post_id == post_id)
    await db.execute(stmt)

async def ingest_post_chunk(post_id: int, db: AsyncSession, tokenizer: PreTrainedTokenizerBase, model: EmbeddingProvider):
    post = await getPost(post_id=post_id, db=db)
    sections = generate_sections(post=post)
    post_chunks = await build_post_chunks(post=post, sections=sections, model=model, tokenizer=tokenizer)
    await delete_post_chunks_by_post_id(post_id=post_id, db=db)
    db.add_all(post_chunks) 