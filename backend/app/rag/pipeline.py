from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import PostChunk
from app.rag.retrieval_dense import retrieve_dense_chunks
from app.rag.prompts import answer_v1 as answer_prompt
from app.rag.generation import generate_answer
from app.rag.config import RETRIEVAL_CONFIG

# lexical search
from app.rag.retrieval_lexical import calculate_all_bm25_scores, find_top_k_lexical_search_results
from rank_bm25 import BM25Okapi

async def run_rag_pipeline(query: str, 
                   db: AsyncSession) -> tuple[str, list[tuple[PostChunk, float]]]:    
    combined_rows = await retrieve_dense_chunks(query=query, db=db, top_k=RETRIEVAL_CONFIG.top_k)
    combined_prompt_text = answer_prompt.build_prompt(user_query=query, combined_rows=combined_rows)
    generated_answer = await generate_answer(prompt=combined_prompt_text, rules=answer_prompt.rules)

    return generated_answer, combined_rows

def run_lexical_search_pipeline(query: str, bm25: BM25Okapi) -> tuple[list[int], list[list[str]]]:

    bm_25_scores = calculate_all_bm25_scores(bm25, query)
    top_k_results = find_top_k_lexical_search_results(bm_25_scores, top_k=RETRIEVAL_CONFIG.top_k)

    return top_k_results

