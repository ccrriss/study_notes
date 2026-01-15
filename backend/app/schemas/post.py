from pydantic import BaseModel, Field, ConfigDict

class PostIn(BaseModel):
    title: str = Field(max_length=200)
    slug: str | None = Field(default=None, max_length=220)
    content_md: str
    excerpt: str | None = Field(default=None, max_length=300)
    is_published: bool = True
    tags: list[str] = []

class PostOut(PostIn):
    id: int
    title: str
    slug: str
    content_md: str
    excerpt: str | None
    is_published: bool
    tags: list[str]
    
    model_config = ConfigDict(from_attributes=True)