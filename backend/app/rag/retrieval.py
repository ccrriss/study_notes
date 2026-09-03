from app.db.models import PostChunk
from sentence_transformers import SentenceTransformer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

embedding_model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

# do the vector search work but a retrieve name for better common use
async def retrieve_chunks(query, db:AsyncSession, topk:int= 3) -> list[tuple[PostChunk, float]]:
    query_embedding: list[float] = embedding_model.encode(query).tolist() # ndarray to list

    combined_cosine_distance = PostChunk.combined_embedding.cosine_distance(query_embedding)

    combined_stmt = select(PostChunk, (1-combined_cosine_distance).label("combined_cos_similarity")
                           ).order_by(combined_cosine_distance).limit(topk).options(selectinload(PostChunk.post))

    combined_result = await db.execute(combined_stmt)

    combined_rows = combined_result.all()

    return combined_rows