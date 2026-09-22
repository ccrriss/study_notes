import modal

app = modal.App("minilm-service")

MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

image = (
    modal.Image.debian_slim(python_version="3.11.9").uv_pip_install("sentence-transformers")
)

@app.cls(image=image)
class EmbeddingModel:

    @modal.enter()
    def load_model(self):
        from sentence_transformers import SentenceTransformer        
        self.model = SentenceTransformer(MODEL_NAME)

    @modal.method()
    def embed(self, text: str):
        encoded_text = self.model.encode(text)
        return encoded_text.tolist()