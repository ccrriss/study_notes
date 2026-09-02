from app.db.models import PostChunk
from sentence_transformers import SentenceTransformer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

async def vector_search(query, model: SentenceTransformer, db:AsyncSession, topk:int= 3) -> list[tuple[PostChunk, float]]:
    query_embedding: list[float] = model.encode(query).tolist() # ndarray to list

    combined_cosine_distance = PostChunk.combined_embedding.cosine_distance(query_embedding)

    combined_stmt = select(PostChunk, (1-combined_cosine_distance).label("combined_cos_similarity")
                           ).order_by(combined_cosine_distance).limit(topk).options(selectinload(PostChunk.post))

    combined_result = await db.execute(combined_stmt)

    combined_rows = combined_result.all()

    return combined_rows