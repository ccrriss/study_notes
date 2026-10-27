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

"""
process: cheking dotted pattern first, then check underscore pattern. and replace the checked part with ""

then use jieba to split English and Chinese words to get the list of lexical tokens.

And use bm25 to get the scores of tokenized query and tokenized postchunk content
"""


# preprocessing technical words with re and patterns
def extract_technical_tokens_with_remaining_text(text: str) -> tuple[list[str], str]:
    tech_token_list = []
    def mask_match(match: re.Match):
        tech_token_list.append(match.group().lower())
        return " "

    remaining_text = re.sub(dotted_pattern, mask_match, text)
    remaining_text = re.sub(underscore_pattern, mask_match, remaining_text)
    return tech_token_list, remaining_text

# tokenize the text for general use with jieba
def tokenize_for_lexical_search(text: str) -> list[str]:
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

# for building inverted index, the idx is the position of post_chunk_ids
def build_inverted_index(tokenized_corpus: list[list[str]]) -> dict[str, set[int]]:
    inverted_index_dict = {}
    for idx, document in enumerate(tokenized_corpus):
        for token in document:
            if token not in inverted_index_dict:
                inverted_index_dict[token] = {idx}
            else:
                inverted_index_dict[token].add(idx)
    # token: {idx1, idx2, ....}
    return inverted_index_dict

# if the query in inverted_index_dict, save all the relative document idx in a set
def find_lexical_candidate_indices(query: str, inverted_index_dict: dict[str, set[int]]) -> set[int]:
    tokenized_query_list = tokenize_for_lexical_search(text=query)
    index_set = set()
    for tokenized_query in tokenized_query_list:
        if tokenized_query in inverted_index_dict:
            index_set.update(inverted_index_dict[tokenized_query])

    return index_set

# for lexical retrieve
def calculate_all_bm25_scores(bm25: BM25Okapi, query:str):
    tokenized_query_list = tokenize_for_lexical_search(query)
    scores = bm25.get_scores(tokenized_query_list)
    return scores

def find_top_k_lexical_search_results(scores: list[float], candidate_idx_set: set[int], top_k: int) -> list[tuple[int, float]]:
    sorted_results_by_score = list(enumerate(scores))
    # pair is (index, score)
    sorted_results_by_score = [(idx, score) for (idx, score) in sorted_results_by_score if idx in candidate_idx_set]
    sorted_results_by_score.sort(key=(lambda pair: pair[1]), reverse=True) 
    
    return sorted_results_by_score[:top_k]

async def build_bm25_index(db: AsyncSession) -> tuple[BM25Okapi | None, dict[str, set[int]], list[int]]:
    post_chunk_ids, tokenized_corpus = await build_lexical_search_corpus(db=db)

    if not tokenized_corpus:
        return None, {}, post_chunk_ids

    inverted_idx_dict = build_inverted_index(tokenized_corpus=tokenized_corpus)

    bm25 = BM25Okapi(corpus=tokenized_corpus)
    return bm25, inverted_idx_dict , post_chunk_ids
