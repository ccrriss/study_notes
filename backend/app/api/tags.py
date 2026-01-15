from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.db.models import Tag, post_tag

router = APIRouter(prefix="/api/v1/tags", tags=["tags"])

@router.get("")
async def list_tags(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(
            Tag.name,
            func.count(post_tag.c.post_id).label("count")
        ).join(post_tag, Tag.id == post_tag.c.tag_id)
        .group_by(Tag.name)
    )

    rows = (await db.execute(stmt)).all()

    return [{"name": r.name, "count": r.count} for r in rows]