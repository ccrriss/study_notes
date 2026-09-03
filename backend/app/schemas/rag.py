from pydantic import BaseModel, Field
from typing import Literal, Annotated
from app.schemas.common import QueryText

class RagRequest(BaseModel):
    query: QueryText = Field()

class RagSection(BaseModel):
    heading: str = Field()
    content: str = Field()

class RagSource(BaseModel):
    title: str = Field()
    slug: str = Field()
    
    section_list: list[RagSection] = Field()

class RagResponse(BaseModel):
    sources: list[RagSource] = Field()
    answer: str = Field()