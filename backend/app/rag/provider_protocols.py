from typing import Protocol

class EmbeddingProvider(Protocol):
    async def encode(self, text:str) -> list[float]:
        ...

    async def chunk_and_embed(self, sections: list[tuple[list[str], str]], max_seq_length:int, chunk_overlap: int) -> list[tuple[list[str], list[tuple[str, list[float]]]]]:
        ...

class GenerationProvider(Protocol):
    async def generate_answer(self, prompt: str, rules: str) -> str:
        ...

class RerankingProvider(Protocol):
    async def predict(self, query_content_pairs: list[tuple[str, str]]) -> list[float]:
        ...