from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.db.models import Post,Tag
from app.schemas.post import PostIn, PostOut
from slugify import slugify
from app.api.auth import require_admin_user
from app.db.models import User

router = APIRouter(prefix="/api/v1/posts", tags=["posts"])

@router.post("", response_model = PostOut)
async def create_post(
    payload: PostIn, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_user) # need to be admin
) -> PostOut:
    slug = payload.slug or slugify(payload.title)
    # slug 去重
    exists = await db.scalar(select(Post.id).where(Post.slug == slug))
    if exists:
        raise HTTPException(400, "slug already exists")
    
    #处理标签
    tag_entities = []
    for name in payload.tags:
        t = await db.scalar(select(Tag).where(Tag.name == name))
        if not t:
            t = Tag(name = name)
            db.add(t)
        tag_entities.append(t)

    post = Post(title=payload.title, slug = slug, content_md=payload.content_md, excerpt = payload.excerpt, is_published = payload.is_published, 
                tags = tag_entities)
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return PostOut(
        id=post.id, title=post.title, slug=post.slug, content_md= post.content_md, excerpt=post.excerpt, is_published=post.is_published, 
        tags=[t.name for t in tag_entities]
    )

@router.put("/{post_id}", response_model=PostOut)
async def update_post(
    post_id: int, 
    payload: PostIn, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_user)
):
    stmt = select(Post).where(Post.id == post_id).options(selectinload(Post.tags))
    post = await db.scalar(stmt)
    if not post:
        raise HTTPException(404, "post not found for update")
    # slug 去重
    new_slug = payload.slug or slugify(payload.title)
    exists = await db.scalar(select(Post.id).where(new_slug == Post.slug, Post.id != post_id))
    if exists:
        raise HTTPException(400, "slug already exists")
    # 更新字段
    post.title = payload.title
    post.slug = new_slug
    post.content_md = payload.content_md
    post.excerpt = payload.excerpt
    post.is_published = payload.is_published
    #处理标签
    tag_entities = []
    for name in payload.tags:
        t = await db.scalar(select(Tag).where(Tag.name == name))
        if not t:
            t = Tag(name = name)
            db.add(t)
        tag_entities.append(t)
    # 处理完毕
    post.tags = tag_entities

    await db.commit()
    await db.refresh(post)
    return PostOut(id=post.id, title=post.title, slug=post.slug, content_md=post.slug, excerpt=post.excerpt, is_published=post.is_published, tags = [
        t.name for t in post.tags
    ])

@router.delete("/{post_id}", status_code=204)
async def delete_note(
    post_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_user)
):
    post = await db.scalar(select(Post).where(Post.id == post_id))
    if not post:
        raise HTTPException(404, "post not found")
    await db.delete(post)
    await db.commit()

    return Response(status_code=204)

@router.get("", response_model=dict)
async def list_notes(
    db: AsyncSession = Depends(get_db), 
    q: str | None = None, 
    offset: int = 0, 
    limit: int = 10,
    tag: str | None = None,
    sort: str | None = None,
    ) -> list[PostOut]: 

    # 计算总数
    count_stmt = select(func.count()).select_from(Post)
    
    if q:
        count_stmt = count_stmt.where(Post.title.ilike(f"%{q}%"))
    if tag:
        count_stmt = count_stmt.join(Post.tags).where(Tag.name == tag)

    total = await db.scalar(count_stmt)

    # 查询分页数据
    stmt = select(Post).offset(offset).limit(limit).options(selectinload(Post.tags))
    # 搜索
    if q:
        stmt = stmt.where(Post.title.ilike(f"%{q}%"))
    # 标签过滤
    if tag:
        stmt = stmt.join(Post.tags).where(Tag.name == tag)
    # 标签过滤
    if sort == "oldest":
        stmt = stmt.order_by(Post.created_at.asc())
    else:
        stmt = stmt.order_by(Post.created_at.desc())

    rows = (await db.execute(stmt)).scalars().all()

    items = [
        PostOut(
            id=r.id, 
            title=r.title, 
            slug=r.slug, 
            content_md=r.content_md, 
            excerpt=r.excerpt, 
            is_published=r.is_published, 
            tags=[tag.name for tag in r.tags]
        ) 
        for r in rows]
    return {
        "total": total,
        "items": items
    }

@router.get("/{slug}", response_model=PostOut)
async def get_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Post).where(Post.slug == slug).options(selectinload(Post.tags))
    post = await db.scalar(stmt)
    if not post:
        raise HTTPException(404, "post not found")
    return PostOut(
        id = post.id, title = post.title, slug=post.slug, content_md=post.content_md, excerpt=post.excerpt, 
        is_published=post.is_published, tags= [tag.name for tag in post.tags]
    )

