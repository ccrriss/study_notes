from pydantic import BaseModel, Field

class RagRequest(BaseModel):
    query: str = Field(min_length=10)

class RagSection(BaseModel):
    heading: str = Field()
    content: str = Field()

class RagSource(BaseModel):
    title: str = Field()
    slug: str = Field()
    
    section_list: list[RagSection] = Field()

class RagResponse(BaseModel):
    content_only_source_list: list[RagSource] = Field()
    combined_source_list: list[RagSource] = Field()
    content_only_answer: str = Field()
    combined_answer: str = Field()
