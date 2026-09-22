from typing import Protocol

class EmbeddingProvider(Protocol):
     def encode(self, text:str) -> list[float]:
        ...

class GenerationProvider(Protocol):
    async def generate_answer(self, prompt: str, rules: str) -> str:
        ...

class RerankingProvider(Protocol):
    def predict(query_content_pairs: list[tuple[str, str]]) -> list[float]:
        ...