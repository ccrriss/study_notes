from pydantic import BaseModel, Field, ConfigDict
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

# Modelruntime Metadata
class ModelOptions(BaseModel):
    temperature: float = Field()
    seed: int = Field()
    num_ctx: int = Field()

    model_config = ConfigDict(from_attributes=True)

class ModelRuntimeData(BaseModel):
    model: str = Field()
    prompt_version: str = Field()
    options: ModelOptions = Field()

# config related metadata
class EmbeddingConfig(BaseModel):
    model_name: str = Field()
    embedding_input: str = Field()

class RetrievalConfig(BaseModel):
    top_k: int = Field()
    similarity_method: str = Field()

class ChunkingConfig(BaseModel):
    method: str = Field()
    max_seq_length: int = Field()
    chunk_overlap: int = Field()
    

# Runtime metadata including all backend metadata
class RuntimeMetadata(BaseModel):
    code_version: str = Field()
    generation: ModelRuntimeData = Field()
    judge: ModelRuntimeData = Field()
    embedding: EmbeddingConfig = Field()
    retrieval: RetrievalConfig = Field()
    chunking: ChunkingConfig = Field()
