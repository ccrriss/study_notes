from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy import Text, ARRAY, String
from pgvector.sqlalchemy import VECTOR

class RagBase(AsyncAttrs, DeclarativeBase):
    pass

class PostChunk(RagBase):
    __tablename__ = "post_chunks"

    id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True)
    post_id: Mapped[int] = mapped_column(index=True)
    chunk_idx: Mapped[int] = mapped_column()
    title: Mapped[str] = mapped_column(index=True)
    slug: Mapped[str] = mapped_column(index=True)
    content_chunk: Mapped[str] = mapped_column(Text()) 
    tags: Mapped[list[str]] = mapped_column(ARRAY(String))
    embedding: Mapped[list[float]] = mapped_column(VECTOR(384))
