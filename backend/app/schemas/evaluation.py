from pydantic import BaseModel, Field, ConfigDict
from typing import Annotated, Literal
from app.schemas.common import QueryText

# for generation_evaluation
class BaseEvaluationQuestion(BaseModel):
    id: str = Field()
    query: QueryText = Field()
    gold_answer: str= Field()
    expected_behavior: Annotated[Literal["answer", "refuse"], Field()]
    gold_section: str | None = Field(default=None)

class AnswerQuestion(BaseEvaluationQuestion):
    expected_behavior: Literal["answer"] = Field()
    vital_nuggets: list[str] = Field()
    ok_nuggets: list[str] | None = Field(default=None)

class RefusalQuestion(BaseEvaluationQuestion):
    expected_behavior: Annotated[Literal["refuse"], Field()]
    
# for practice and both have same effect
# EvaluationQuestion = AnswerQuestion | RefuseQuestion
GenerationEvaluationQuestion = Annotated[AnswerQuestion | RefusalQuestion, Field(discriminator="expected_behavior")]

class JudgeResult(BaseModel):
    label: str = Field()
    reason: str = Field()

class GenerationJudgement(JudgeResult):
    judgement_type: Literal["vital", "ok", "refusal"] = Field()
    nugget: str | None = Field(default=None)
    label: str = Field()
    reason: str = Field()

class GenerationEvaluationResponse(BaseModel):
    id: str = Field()
    expected_behavior: Literal["answer", "refuse"] = Field()
    generated_answer: str = Field()
    judgements: list[GenerationJudgement] = Field()

# For regular evaluation and mrr

class LatencyMeasurement(BaseModel):
    dense_ms: float = Field()
    lexical_ms: float = Field()
    hybrid_ms: float = Field()
    reranking_ms: float = Field()
    generation_ms: float = Field()
    total_ms: float = Field()

class RetrievedResult(BaseModel):
    rank: int = Field()
    score: float = Field()
    post_id: int = Field()
    chunk_idx: int = Field()
    title: str = Field()
    slug: str = Field()
    heading_path: list[str] = Field()
    content: str = Field()
    
class RetrievalEvaluationResponse(BaseModel):
    generated_answer: str = Field()
    dense_results: list[RetrievedResult] = Field()
    lexical_results: list[RetrievedResult] = Field()
    hybrid_results: list[RetrievedResult] = Field()
    reranking_results: list[RetrievedResult] = Field()
    latency: LatencyMeasurement = Field()