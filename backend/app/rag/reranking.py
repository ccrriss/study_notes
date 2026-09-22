from app.rag.provider_protocols import RerankingProvider
from app.rag.config import RERANKING_CONFIG
from app.schemas.evaluation import RetrievedResult

final_k = RERANKING_CONFIG.final_k

def generate_reranking_retrieved_results(query: str, model: RerankingProvider, retrieved_results: list[RetrievedResult]) -> list[RetrievedResult]:
    query_content_pairs = [(query, f"{' > '.join(retrieved_result.heading_path)} {retrieved_result.content}")
                            for retrieved_result in retrieved_results]
    scores = model.predict(query_content_pairs)
    reranking_results = []
    for idx, retrieved_result in enumerate(retrieved_results):
        reranking_result = retrieved_result.model_copy()
        reranking_result.score = float(scores[idx])
        reranking_results.append(reranking_result)

    reranking_results.sort(key= lambda reranking_result: reranking_result.score, reverse=True)
    reranking_results = reranking_results[:final_k]
    for idx, reranking_result in enumerate(reranking_results):
        reranking_result.rank = idx + 1
    return reranking_results
