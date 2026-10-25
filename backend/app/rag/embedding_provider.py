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

    async def encode(self, text:str) -> list[float]:
        return await self.embedding_model.embed.remote.aio(text)

    async def chunk_and_embed(self, sections: list[tuple[list[str], str]], max_seq_length:int, chunk_overlap: int) -> list[tuple[list[str], list[tuple[str, list[float]]]]]:
        return await self.embedding_model.chunk_and_embed.remote.aio(sections=sections, max_seq_length=max_seq_length, chunk_overlap=chunk_overlap)


class LocalEmbeddingProvider:
    def __init__(self):
        from sentence_transformers import SentenceTransformer
        self.embedding_model = SentenceTransformer(EMBEDDING_CONFIG.model_name)
        self.tokenizer = self.embedding_model.tokenizer

    async def encode(self, text: str) -> list[float]:
        return self.embedding_model.encode(text).tolist()
    
    async def chunk_and_embed(self, sections: list[tuple[list[str], str]], max_seq_length:int, chunk_overlap: int) -> list[tuple[list[str], list[tuple[str, list[float]]]]]:
        special_tokens = self.tokenizer.num_special_tokens_to_add(pair=False)
        
        heading_path_and_content_embed_list: list[tuple[list[str], list[tuple[str, list[float]]]]] = []

        for heading_path, content in sections:
            heading_text = " > ".join(heading_path).strip()

            heading_path_encoded = self.tokenizer.encode(heading_text, add_special_tokens=False)
            content_encoded = self.tokenizer.encode(content, add_special_tokens=False, verbose=False)

            content_budget = max_seq_length - len(heading_path_encoded) - special_tokens - 2

            if content_budget <= chunk_overlap:
                raise ValueError(
                        "heading path is too long for the token budget"
                    )

            step_size = content_budget - chunk_overlap

            if len(content_encoded) > content_budget:
                heading_path_and_embedding_tuple: tuple[list[str], list[tuple[str, list[float]]]] = (heading_path, [])
                for i in range(0, len(content_encoded), step_size):
                    content_chunk = content_encoded[i: i+content_budget]
                    content_text = self.tokenizer.decode(content_chunk)
                    embedding = self.embedding_model.encode(heading_text + "\n" + content_text).tolist()
                    content_and_embedding_tuple = (content_text, embedding)
                    heading_path_and_embedding_tuple[1].append(content_and_embedding_tuple)

                    if i + content_budget >= len(content_encoded):
                        break
            else:
                embedding = self.embedding_model.encode(heading_text + "\n" + content).tolist()
                heading_path_and_embedding_tuple = (heading_path, [(content, embedding)])
        
            heading_path_and_content_embed_list.append(heading_path_and_embedding_tuple)

        return heading_path_and_content_embed_list