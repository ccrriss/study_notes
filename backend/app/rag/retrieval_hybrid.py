from app.schemas.evaluation import RetrievedResult

def fuse_hybrid_retrieval_results(dense_results: list[RetrievedResult], lexical_results: list[RetrievedResult], top_k: int) -> list[RetrievedResult]:
    k = 60
    hybrid_result_dict: dict[str, RetrievedResult] = {}
    for dense_result in dense_results:
        post_id = dense_result.post_id
        chunk_idx = dense_result.chunk_idx
        rank = dense_result.rank
        post_id_and_chunk_idx = f"{post_id}-{chunk_idx}"
        rrf_score = 1 / (k + rank)

        dense_result_with_rrf = RetrievedResult.model_copy(dense_result)
        dense_result_with_rrf.score = rrf_score

        hybrid_result_dict[post_id_and_chunk_idx] = dense_result_with_rrf

    for lexical_result in lexical_results:
        post_id = lexical_result.post_id
        chunk_idx = lexical_result.chunk_idx
        rank = lexical_result.rank
        post_id_and_chunk_idx = f"{post_id}-{chunk_idx}"
        rrf_score = 1 / (k + rank)

        if post_id_and_chunk_idx in hybrid_result_dict:
            hybrid_result_dict[post_id_and_chunk_idx].score += rrf_score
        else:
            lexical_result_with_rrf = RetrievedResult.model_copy(lexical_result)
            lexical_result_with_rrf.score = rrf_score
            hybrid_result_dict[post_id_and_chunk_idx] = lexical_result_with_rrf

    # order by the score and slice for topk only
    list_of_hybrid_dict = list(hybrid_result_dict.items())
    list_of_hybrid_dict.sort(key=lambda pair: pair[1].score, reverse=True)
    list_of_hybrid_dict = list_of_hybrid_dict[:top_k]

    for idx, (post_id_and_chunk_idx, hybrid_result) in enumerate(list_of_hybrid_dict):
        hybrid_result.rank = idx + 1

    return [hybrid_result for (post_id_and_chunk_idx, hybrid_result) in list_of_hybrid_dict]
