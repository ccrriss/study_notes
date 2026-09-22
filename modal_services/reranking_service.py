import modal

app = modal.App("reranking-service")

MODEL_NAME="BAAI/bge-reranker-v2-m3"

image = (
    modal.Image.debian_slim(python_version="3.11.9").uv_pip_install("sentence-transformers")
)

@app.cls(image=image)
class RerankingModel:

    @modal.enter()
    def load_model(self):
        from sentence_transformers.cross_encoder import CrossEncoder
        self.model = CrossEncoder(MODEL_NAME)

    @modal.method()
    def predict(self, query_content_pairs: list[tuple[str, str]]) -> list[float]:
        scores = self.model.predict(query_content_pairs)
        return scores.tolist()