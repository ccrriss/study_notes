import modal
from app.rag.config import EMBEDDING_CONFIG

"""
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
ModalEmbedding:
@modal.enter()
    def load_model(self):
        from sentence_transformers import SentenceTransformer        
        self.model = SentenceTransformer(MODEL_NAME)

@modal.method()
def embed(self, text: str):
    encoded_text = self.model.encode(text)
    return encoded_text.tolist()
"""


class ModalEmbeddingProvider:
    def __init__(self):
        EmbeddingModel = modal.Cls.from_name(
            app_name="minilm-service",
            name="EmbeddingModel"
        )
        self.embedding_model = EmbeddingModel()

    def encode(self, text:str) -> list[float]:
        return self.embedding_model.embed.remote(text)

class LocalEmbeddingProvider:
    def __init__(self):
        from sentence_transformers import SentenceTransformer
        self.embedding_model = SentenceTransformer(EMBEDDING_CONFIG.model_name)
    def encode(self, text: str) -> list[float]:
        return self.embedding_model.encode(text).tolist()

EmbeddingProvider = ModalEmbeddingProvider | LocalEmbeddingProvider