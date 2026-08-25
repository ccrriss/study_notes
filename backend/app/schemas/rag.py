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
    combined_source_list: list[RagSource] = Field()
    combined_answer: str = Field()

class RawRetrivedResult(BaseModel):
    rank: int = Field()
    similarity: float = Field()
    post_id: int = Field()
    chunk_idx: int = Field()
    title: str = Field()
    slug: str = Field()
    heading_path: list[str] = Field()
    content: str = Field()

class EvaluationResponse(BaseModel):
    combined_answer: str = Field()
    raw_retrieved_results: list[RawRetrivedResult] = Field()