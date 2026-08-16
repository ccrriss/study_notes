from fastapi import APIRouter, Depends
from app.schemas.post import PostOut
from app.db.session import get_db
from sqlalchemy import func, select
from app.db.models import Post, Tag
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/api/v1/rag", tags=['posts', 'rag'])

chunk_size = 30
chunk_overlap = 8
step_size = chunk_size - chunk_overlap

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

@router.get("", response_model=dict)
async def get_posts(
    q: str|None = None,
    tag: str|None = None,
    sort: str|None = None,
    offset: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
) -> dict:
    stmt = select(Post).offset(offset).limit(limit).options(selectinload(Post.tags))

    if q:
        stmt = stmt.where(Post.title.ilike(f"%{q}%"))
    if tag:
        stmt = stmt.join(Post.tags).where(Tag.name == tag)
    if sort == "oldest":
        stmt = stmt.order_by(Post.created_at.asc())
    else:
        stmt = stmt.order_by(Post.created_at.desc())

    rows = (await db.scalars(stmt)).all()

    chunks = preprocessing_data(rows)

    return {
        "chunks": chunks
    }