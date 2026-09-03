from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import PostChunk
from app.rag.retrieval import retrieve_chunks
from app.rag.prompts.answer_v1 import build_prompt, rules
from app.rag.generation import generate_answer

async def run_rag_pipeline(query: str, 
                   db: AsyncSession) -> tuple[str, list[tuple[PostChunk, float]]]:    
    combined_rows = await retrieve_chunks(query=query, db=db)
    combined_prompt_text = build_prompt(user_query=query, combined_rows=combined_rows)
    generated_answer = await generate_answer(prompt=combined_prompt_text, rules=rules)

    return generated_answer, combined_rows