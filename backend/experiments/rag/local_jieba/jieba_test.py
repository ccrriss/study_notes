import jieba
import re
from rank_bm25 import BM25Okapi
from app.db.models import PostChunk
texts = [
    "FastAPI 使用 allow_origins 配置 CORS",
    "SQLAlchemy 异步访问 post.tags",
    "OpenCV 使用 cv2.adaptiveThreshold 处理图片阴影",
]

basic_segment = r'[a-zA-Z][0-9a-zA-Z]*'
underscore_pattern = rf'{basic_segment}(?:_{basic_segment})+'
dotted_pattern = rf'{basic_segment}(?:_{basic_segment})*(?:\.{basic_segment}(?:_{basic_segment})*)+'

def extract_and_mask_techinical_tokens(text: str):
    token_list = []
    def mask_match(match: re.Match):
        token_list.append(match.group().lower())
        return " "

    remaining_text = re.sub(dotted_pattern, mask_match, text)
    remaining_text = re.sub(underscore_pattern, mask_match, remaining_text)
    return token_list, remaining_text

def tokenize_for_lexical_search(text: str):
    token_list, remaining_text = extract_and_mask_techinical_tokens(text)
    remaining_text_token_list = jieba.lcut(remaining_text)
    remaining_text_token_list = [token.strip().lower() for token in remaining_text_token_list if token.strip() and 
                                 any(char.isalnum() for char in token)]
    return token_list + remaining_text_token_list


tokenized_corpus = [tokenize_for_lexical_search(text) for text in texts]
print(tokenized_corpus)
bm25 = BM25Okapi(tokenized_corpus)
query = "FastAPI 如何配置 allow_origins?"
tokenized_query = tokenize_for_lexical_search(query)
print(tokenized_query)
scores = bm25.get_scores(tokenized_query)
print(scores)

def create_tokenized_corpus(post_chunks: list[PostChunk]):
    tokenized_corpus = []
    for post_chunk in post_chunks:
        tokenized_content = tokenize_for_lexical_search(post_chunk.content_chunk)
        tokenized_corpus.append(tokenized_content)
    return tokenized_corpus

def get_all_bm25_scores(query:str, tokenized_corpus: list[list[str]]):
    bm25 = BM25Okapi(corpus=tokenized_corpus)
    tokenized_query = tokenize_for_lexical_search(query)
    scores = bm25.get_scores(tokenized_query)
    return scores

def find_top_k_lexical_search_results(scores: list[float], top_k: int):
    sorted_results_by_score = list(enumerate(scores))
    sorted_results_by_score.sort(key=(lambda pair: pair[1]))
    sorted_results_by_score.reverse()
    return sorted_results_by_score[:top_k]

