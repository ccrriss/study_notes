"""

Including providers for github actions CI smoke test

with INFERENCE_MODE set to "test"

"""

class TestEmbeddingProvider:
    def __init__(self):
        pass

    async def encode(self, text:str) -> list[float]:
       raise RuntimeError("Encoding in embedding is disabled in test mode")

    async def chunk_and_embed(self, sections: list[tuple[list[str], str]], max_seq_length:int, chunk_overlap: int) -> list[tuple[list[str], list[tuple[str, list[float]]]]]:
        raise RuntimeError("Chunk_and_embed in embedding is disabled in test mode")

class TestGenerationProvider:
    def __init__(self):
        pass

    async def generate_answer(self, prompt: str, rules: str) -> str:
        raise RuntimeError("Generate_answer in generation is disabled in test mode")

class TestRerankingProvider:
    def __init__(self):
        pass

    async def predict(self, query_content_pairs: list[tuple[str, str]]) -> list[float]:
        raise RuntimeError("Predict in reranking is disabled in test mode")