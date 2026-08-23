from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Text, Table, ForeignKey, Boolean, DateTime, func,Column, ARRAY
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncAttrs
from pgvector.sqlalchemy import VECTOR

class Base(AsyncAttrs, DeclarativeBase):
    pass

post_tag = Table(
    "post_tag", Base.metadata,
    Column("post_id", ForeignKey("posts.id"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id"), primary_key=True),
)

class Post(Base):
    __tablename__ = "posts"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True)
    content_md: Mapped[str] = mapped_column(Text())
    excerpt: Mapped[str | None] = mapped_column(String(300))
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(onupdate=func.now(), server_default=func.now())
    tags: Mapped[list["Tag"]] = relationship(secondary=post_tag, back_populates="posts")

    post_chunks: Mapped[list["PostChunk"]] = relationship(back_populates="post")

class Tag(Base):
    __tablename__ = "tags"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    posts: Mapped[list[Post]] = relationship(secondary=post_tag, back_populates="tags")

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(128))
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

class PostChunk(Base):
    __tablename__ = "post_chunks"

    id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True)

    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id"), index=True)
    post: Mapped[Post] = relationship(back_populates="post_chunks")

    chunk_idx: Mapped[int] = mapped_column()

    content_chunk: Mapped[str] = mapped_column(Text()) 
    embedding: Mapped[list[float]] = mapped_column(VECTOR(384))
    combined_embedding: Mapped[list[float]] = mapped_column(VECTOR(384))

    heading_path: Mapped[list[str]] = mapped_column(ARRAY(String))