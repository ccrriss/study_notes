from sqlalchemy.orm import selectinload
from sqlalchemy import select, text
import asyncio
from pathlib import Path
import sys
from sentence_transformers import SentenceTransformer
from models import PostChunk, RagBase

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

async def getPosts():
    async with AsyncSessionLocal() as db:
        posts = (await db.scalars(select(Post).options(selectinload(Post.tags)))).all()
        return posts

async def init_rag_database():   
    create_db_text = text("CREATE EXTENSION IF NOT EXISTS vector;")

    async with rag_engine.begin() as rag_conn:
        await rag_conn.execute(create_db_text)
        
        await rag_conn.run_sync(RagBase.metadata.create_all)

async def get_chunks() -> list[PostChunk] :
    posts = await getPosts()
    chunks = preprocessing_data(posts)
    return chunks

async def vector_search(query, topk:int= 3):
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

async def add_all_chunks():
    chunks = await get_chunks()
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

async def main():
    await init_rag_database()

    await add_all_chunks()

    await rag_engine.dispose()

# asyncio.run(main())
# asyncio.run(add_all_chunks())

# rows, combined_rows = asyncio.run(vector_search("SQLAlchemy 中 engine 和 session 分别负责什么?"))
rows, combined_rows = asyncio.run(vec_search("FastAPI的路由如何设置?"))
for chunk, similarity in rows:
    print(chunk.content_chunk, similarity)
print("==========================================================\n")
for combined_chunk, combined_similarity in combined_rows:
    print(combined_chunk.content_chunk, combined_similarity)
