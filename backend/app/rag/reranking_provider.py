import modal
from app.rag.config import RERANKING_CONFIG
"""
    @modal.method()
    def predict(self, query_content_pairs: list[tuple[str, str]]) -> list[float]:
        scores = self.model.predict(query_content_pairs)
        return scores.tolist()
"""
class ModalRerankingProvider:
    def __init__(self):
        RerankingModel = modal.Cls.from_name(
            app_name="reranking-service",
            name="RerankingModel"
        )
        self.reranking_model = RerankingModel()
    def predict(self, query_content_pairs: list[tuple[str, str]]):
        return self.reranking_model.predict.remote(query_content_pairs)

class LocalRerankingProvider:
    def __init__(self):
        from sentence_transformers.cross_encoder import CrossEncoder

        self.reranking_model = CrossEncoder(RERANKING_CONFIG.model_name)
    def predict(self, query_content_pairs: list[tuple[str, str]]):
        return self.reranking_model.predict(query_content_pairs)

RerankingProvider = ModalRerankingProvider | LocalRerankingProvider
        
