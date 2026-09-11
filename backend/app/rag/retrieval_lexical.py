import jieba
import re
from rank_bm25 import BM25Okapi
from app.db.models import PostChunk
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.rag.config import RETRIEVAL_CONFIG

basic_segment = r'[a-zA-Z][0-9a-zA-Z]*'
underscore_pattern = rf'{basic_segment}(?:_{basic_segment})+'
dotted_pattern = rf'{basic_segment}(?:_{basic_segment})*(?:\.{basic_segment}(?:_{basic_segment})*)+'

# preprocessing technical words with re and patterns
def extract_technical_tokens_with_remaining_text(text: str):
    tech_token_list = []
    def mask_match(match: re.Match):
        tech_token_list.append(match.group().lower())
        return " "

    remaining_text = re.sub(dotted_pattern, mask_match, text)
    remaining_text = re.sub(underscore_pattern, mask_match, remaining_text)
    return tech_token_list, remaining_text

# tokenize the text for general use with jieba
def tokenize_for_lexical_search(text: str):
    tech_token_list, remaining_text = extract_technical_tokens_with_remaining_text(text)
    remaining_text_token_list = jieba.lcut(remaining_text)
    remaining_text_token_list = [token.strip().lower() for token in remaining_text_token_list if token.strip() and 
                                 any(char.isalnum() for char in token)]
    return tech_token_list + remaining_text_token_list

# to be used in main.py
async def build_lexical_search_corpus(db: AsyncSession) -> tuple[list[int], list[list[str]]]:
    post_chunks = await db.scalars(select(PostChunk))
    post_chunks = post_chunks.all()
    tokenized_corpus = []
    post_chunk_ids = []

    for post_chunk in post_chunks:
        heading_text = " > ".join(post_chunk.heading_path)
        lexical_text = f"{heading_text} {post_chunk.content_chunk}"
        tokenized_content = tokenize_for_lexical_search(lexical_text)
        tokenized_corpus.append(tokenized_content)
        post_chunk_ids.append(post_chunk.id)

    return post_chunk_ids, tokenized_corpus
    
def calculate_all_bm25_scores(bm25: BM25Okapi, query:str):
    tokenized_query = tokenize_for_lexical_search(query)
    scores = bm25.get_scores(tokenized_query)
    return scores

# TEMP
def find_top_k_lexical_search_results(scores: list[float], top_k: int) -> list[tuple[int, float]]:
    sorted_results_by_score = list(enumerate(scores))
    sorted_results_by_score.sort(key=(lambda pair: pair[1]))
    sorted_results_by_score.reverse()
    return sorted_results_by_score[:top_k]


