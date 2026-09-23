from typing import Protocol

class EmbeddingProvider(Protocol):
    async def encode(self, text:str) -> list[float]:
        ...

class GenerationProvider(Protocol):
    async def generate_answer(self, prompt: str, rules: str) -> str:
        ...

class RerankingProvider(Protocol):
    async def predict(self, query_content_pairs: list[tuple[str, str]]) -> list[float]:
        ...