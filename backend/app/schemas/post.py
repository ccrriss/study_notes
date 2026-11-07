from pydantic import BaseModel, Field, ConfigDict, StringConstraints, field_validator
from datetime import datetime
from typing import Annotated

TagName = Annotated[str,
                    StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]

class PostIn(BaseModel):
    title: str = Field(max_length=200)
    slug: str | None = Field(default=None, max_length=220)
    content_md: str
    excerpt: str | None = Field(default=None, max_length=300)
    is_published: bool = True
    tags: list[TagName] = Field(default_factory=list)

    @field_validator("tags")
    @classmethod
    def duplicate_tags(cls, tags: list[str]) -> list[str]:
        return list(dict.fromkeys(tags))

class PostOut(PostIn):
    id: int
    title: str
    slug: str
    content_md: str
    excerpt: str | None
    is_published: bool
    tags: list[str]
    
    model_config = ConfigDict(from_attributes=True)

class ManagedPostOut(PostOut):
    user_id: int
    username: str
    created_at: datetime
    updated_at: datetime