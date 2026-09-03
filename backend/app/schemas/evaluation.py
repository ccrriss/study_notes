from pydantic import BaseModel, Field
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

class GenerationJudgement(BaseModel):
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

class RawRetrievedResult(BaseModel):
    rank: int = Field()
    similarity: float = Field()
    post_id: int = Field()
    chunk_idx: int = Field()
    title: str = Field()
    slug: str = Field()
    heading_path: list[str] = Field()
    content: str = Field()

class RetrievalEvaluationResponse(BaseModel):
    generated_answer: str = Field()
    raw_retrieved_results: list[RawRetrievedResult] = Field()