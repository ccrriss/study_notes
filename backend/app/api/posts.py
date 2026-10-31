from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.db.models import Post,Tag
from app.schemas.post import PostIn, PostOut
from slugify import slugify
from app.api.auth import require_admin_user, get_current_user
from app.db.models import User

# PostChunk related
from app.rag.provider_protocols import EmbeddingProvider
from fastapi import Request
from app.rag.ingestion.post_chunks import refresh_post_chunks, add_post_chunks
from app.rag.retrieval_lexical import build_bm25_index

router = APIRouter(prefix="/api/v1/posts", tags=["posts"])

@router.post("", response_model = PostOut)
async def create_post(
    payload: PostIn, 
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> PostOut:
    slug = payload.slug or slugify(payload.title)

    # Embedding model
    embedding_model: EmbeddingProvider = request.app.state.embedding_model

    # slug 去重
    exists = await db.scalar(select(Post.id).where(Post.slug == slug))
    if exists:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "slug already exists")
    
    #处理标签
    tag_entities = []
    for name in payload.tags:
        t = await db.scalar(select(Tag).where(Tag.name == name))
        if not t:
            t = Tag(name = name)
            db.add(t)
        tag_entities.append(t)

    # post = Post(title=payload.title, slug = slug, content_md=payload.content_md, excerpt = payload.excerpt, is_published = payload.is_published, 
    #             tags = tag_entities)
    post = Post(**payload.model_dump(exclude={"slug", "tags"}), slug=slug, tags=tag_entities, user_id=current_user.id)

    db.add(post)
    
    await db.flush()
    # add post_chunks
    await add_post_chunks(post=post, db=db, model=embedding_model)

    await db.commit()

    # rebuild bm25 after adding post_chunks
    bm25, inverted_idx_dict, post_chunk_ids = await build_bm25_index(db=db)
    request.app.state.bm25 = bm25
    request.app.state.inverted_idx_dict = inverted_idx_dict
    request.app.state.post_chunk_ids = post_chunk_ids

    return PostOut(
        id=post.id, title=post.title, slug=post.slug, content_md= post.content_md, excerpt=post.excerpt, is_published=post.is_published, 
        tags=[t.name for t in tag_entities]
    )

@router.put("/{post_id}", response_model=PostOut)
async def update_post(
    post_id: int, 
    payload: PostIn, 
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Post).where(Post.id == post_id).options(selectinload(Post.tags))
    # Embedding model
    embedding_model: EmbeddingProvider = request.app.state.embedding_model

    post = await db.scalar(stmt)
    if not post:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "post not found for update")

    # if the post is not created by the current user and not admin user, raise Exception
    if post.user_id != current_user.id:
        if not current_user.is_admin:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not have permission to update this post") 
    
    # slug 去重
    new_slug = payload.slug or slugify(payload.title)
    exists = await db.scalar(select(Post.id).where(Post.slug == new_slug, Post.id != post_id))
    if exists:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "slug already exists")
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

    # refresh post_chunks after updating posts
    await refresh_post_chunks(post=post, db=db, model=embedding_model)

    await db.commit()

    # rebuild bm25 after updating post_chunks
    bm25, inverted_idx_dict, post_chunk_ids = await build_bm25_index(db=db)
    request.app.state.bm25 = bm25
    request.app.state.inverted_idx_dict = inverted_idx_dict
    request.app.state.post_chunk_ids = post_chunk_ids

    return PostOut(id=post.id, title=post.title, slug=post.slug, content_md=post.content_md, excerpt=post.excerpt, is_published=post.is_published, tags = [
        t.name for t in post.tags
    ])

@router.delete("/{post_id}", status_code=204)
async def delete_note(
    post_id: int, 
    request: Request, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = await db.scalar(select(Post).where(Post.id == post_id))

    if not post:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "post not found")

    # if the post is not created by the current user and not admin user, raise Exception
    if post.user_id != current_user.id:
        if not current_user.is_admin:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not have permission to delete this post") 
    
    await db.delete(post)
    await db.commit()

    # rebuild bm25 after deleting post_chunks
    bm25, inverted_idx_dict, post_chunk_ids = await build_bm25_index(db=db)
    request.app.state.bm25 = bm25
    request.app.state.inverted_idx_dict = inverted_idx_dict
    request.app.state.post_chunk_ids = post_chunk_ids

    return Response(status_code=204)

@router.get("", response_model=dict)
async def list_notes(
    db: AsyncSession = Depends(get_db), 
    q: str | None = None, 
    offset: int = 0, 
    limit: int = 10,
    tag: str | None = None,
    sort: str | None = None,
    ) -> dict: 

    # 计算总数
    count_stmt = select(func.count()).select_from(Post).where(Post.is_published.is_(True))
    
    if q:
        count_stmt = count_stmt.where(Post.title.ilike(f"%{q}%"))
    if tag:
        count_stmt = count_stmt.join(Post.tags).where(Tag.name == tag)

    total = await db.scalar(count_stmt)

    # 查询分页数据
    stmt = select(Post).offset(offset).limit(limit).options(selectinload(Post.tags)).where(Post.is_published.is_(True))
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

    rows = (await db.scalars(stmt)).all()

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
    stmt = select(Post).where(Post.slug == slug, Post.is_published.is_(True)).options(selectinload(Post.tags))
    post = await db.scalar(stmt)
    if not post:
        raise HTTPException(404, "post not found")
    return PostOut(
        id = post.id, title = post.title, slug=post.slug, content_md=post.content_md, excerpt=post.excerpt, 
        is_published=post.is_published, tags= [tag.name for tag in post.tags]
    )

