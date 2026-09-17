from app.rag.retrieval_lexical import tokenize_for_lexical_search, calculate_all_bm25_scores, find_top_k_lexical_search_results
from rank_bm25 import BM25Okapi

"""
Arrange: different kinds of texts
Act: tokenize_for_lexical_search
Assert: the tokenized texts are as expected or not
"""

text_A = r"abc_def很好.123_hjk_lmn.opq_rst_uvw_xyz.ABC今天天气不错"
text_B = "___ ... !!! ---"
text_C = "model2_version3 api2.client4"
def test_retrieval_lexical():
    result_token_list_A = tokenize_for_lexical_search(text_A)
    result_token_list_B = tokenize_for_lexical_search(text_B)
    result_token_list_C = tokenize_for_lexical_search(text_C)

    assert (result_token_list_A == ['hjk_lmn.opq_rst_uvw_xyz.abc', 'abc_def', '很', '好', '123', '今天天气', '不错'])
    assert (result_token_list_B == [])
    assert (result_token_list_C == ['api2.client4', 'model2_version3'])

raw_corpus = [
    r"需要使用ClassA/B中的属性时可以用`isinstance`来判断",
    r"在`next.js`中，只有以`NEXT_PUBLIC`开头的环境变量才会被注入到浏览器端代码中, 也就是前端也能用",
    r"`engine.begin`和`engine.connect`的区别"
]

query = r"next.js中, 什么环境变量会注入浏览器代码中?"

tokenized_corpus = [
    tokenize_for_lexical_search(text) for text in raw_corpus
]

bm25 = BM25Okapi(corpus=tokenized_corpus)

def test_bm25_scores_and_top_k_results():
    scores = calculate_all_bm25_scores(bm25=bm25, query=query)
    assert(scores[1] > scores[0])
    assert(scores[1] > scores[2])

    sorted_results_by_score = find_top_k_lexical_search_results(scores=scores, top_k=2)
    assert(len(sorted_results_by_score) == 2)
    # check whether the original index is 1
    assert(sorted_results_by_score[0][0] == 1)