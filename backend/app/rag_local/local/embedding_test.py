"""
This file is for local dev. And works for local pg database.
"""

from sqlalchemy.orm import selectinload
from sqlalchemy import select, text
import asyncio
from pathlib import Path
import sys
from sentence_transformers import SentenceTransformer
from backend.app.rag_local.local.models import PostChunk, RagBase

CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent.parent
sys.path.append(str(BACKEND_DIR))

from app.db.session import AsyncSessionLocal, Rag_AsyncSessionLocal, rag_engine
from app.db.models import Post
from transformers import PreTrainedTokenizerBase
from backend.app.rag_local.local.llm import generate_answer

# copied from app.api.rag
content_chunk_size = 100
chunk_overlap = 8
step_size = content_chunk_size - chunk_overlap

model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
tokenizer: PreTrainedTokenizerBase = model.tokenizer
from markdown_aware_chunking_v1 import get_sections_from_posts, preprocessing_post_with_sections_md
from backend.app.rag_local.local.initialize_db import main
from backend.app.rag_local.local.q_a_list import get_q_a_list
from hold_out_q_a_list import get_hold_out_q_a_list
from backend.app.rag_local.local.prompt_v1 import get_prompt
from backend.app.rag_local.local.llm import generate_answer

async def getPosts():
    async with AsyncSessionLocal() as db:
        posts = (await db.scalars(select(Post).options(selectinload(Post.tags)))).all()
        return posts

async def vector_search(query, topk:int= 3) -> tuple[list[tuple[PostChunk, float]], list[tuple[PostChunk, float]]]:
    query_embedding = model.encode(query) # ndarray
    query_embedding: list[float] = query_embedding.tolist()

    cosine_distance = PostChunk.embedding.cosine_distance(query_embedding)
    combined_cosine_distance = PostChunk.combined_embedding.cosine_distance(query_embedding)

    stmt = select(PostChunk, (1-cosine_distance).label("cos_similarity")).order_by(cosine_distance).limit(topk)
    combined_stmt = select(PostChunk, (1-combined_cosine_distance).label("combined_cos_similarity")).order_by(combined_cosine_distance).limit(topk)

    async with Rag_AsyncSessionLocal() as rag_db:
        result = await rag_db.execute(stmt)
        combined_result = await rag_db.execute(combined_stmt)
        rows = result.all()
        combined_rows = combined_result.all()

    return rows, combined_rows

# for testing
async def add_chunk(chunk: PostChunk):
    async with Rag_AsyncSessionLocal() as rag_db:
        rag_db.add(chunk)
        await rag_db.commit()
        await rag_db.refresh(chunk)
    return chunk

async def add_all_chunks(chunks: list[PostChunk]):
    async with Rag_AsyncSessionLocal() as rag_db:
        rag_db.add_all(chunks)
        await rag_db.commit()

async def get_first_chunk():
    async with Rag_AsyncSessionLocal() as rag_db:
        chunks = await rag_db.scalars(select(PostChunk))
        first_chunk = chunks.first()
        print(f"id: {first_chunk.id}, post_id: {first_chunk.post_id}, content_md:{first_chunk.content_chunk}, embedding_dim:{len(first_chunk.embedding)}")

async def vec_search(q: str):
    rows, combined_rows = await vector_search(q)
    return rows, combined_rows

def print_result(rows:list[tuple[PostChunk, float]], combined_rows:list[tuple[PostChunk, float]]):
    for post_chunk, similarity in rows:
        print(f"Heading Path: {post_chunk.heading_path}\n")
        print(f"Content: {post_chunk.content_chunk}\n")
        print(f"Similarity: {similarity}\n")
    print("==========================================================\n")
    for combined_post_chunk, combined_similarity in combined_rows:
        print(f"Heading Path: {combined_post_chunk.heading_path}\n")
        print(f"Content: {combined_post_chunk.content_chunk}\n")
        print(f"Similarity: {combined_similarity}\n")
    print("==========================================================\n")

async def add_all_chunks_md_aware():
    posts = await getPosts()
    post_with_sections = get_sections_from_posts(posts)
    chunks = preprocessing_post_with_sections_md(post_with_sections, model=model)
    await add_all_chunks(chunks)

# asyncio.run(main())
# asyncio.run(add_all_chunks_md_aware())

async def vec_search_ten_questions():
    q_a_list = get_q_a_list()
    for q_a_dict in q_a_list:
        rows, combined_rows = await vec_search(q_a_dict["q"])
        print(f"Question is: {q_a_dict['q']}\n")
        print(f"right answer: {q_a_dict['a']}\n")
        print_result(rows, combined_rows)

# asyncio.run(vec_search_ten_questions())

async def prompt_v1_test():
    # q_a_list = get_q_a_list()
    q_a_list = get_hold_out_q_a_list()

    content_only_qa_list = []
    combined_qa_list = []

    for i, q_a_dict in enumerate(q_a_list):
        rows, combined_rows = await vec_search(q_a_dict["q"])
        prompt_text, combined_prompt_text = get_prompt(user_query=q_a_dict["q"], rows=rows, combined_rows=combined_rows)
        content_only_answer = await generate_answer(prompt=prompt_text)
        combined_answer = await generate_answer(prompt=combined_prompt_text)
        content_only_qa_list.append((q_a_dict["q"], q_a_dict["a"], content_only_answer))
        combined_qa_list.append((q_a_dict["q"], q_a_dict["a"], combined_answer))

    for i, (q, a, llm_answer) in enumerate(content_only_qa_list):
        print(f"Q{i+1}: \n")
        print(f"query is :{q} \n")
        print(f"answer is :{a} \n")
        print(f"llm_answer is :{llm_answer} \n\n")

    for i, (q, a, llm_answer)in enumerate(combined_qa_list):
        print(f"Q{i+1}: \n")
        print(f"query is :{q} \n")
        print(f"answer is :{a} \n")
        print(f"llm_answer is :{llm_answer} \n\n")

asyncio.run(prompt_v1_test())