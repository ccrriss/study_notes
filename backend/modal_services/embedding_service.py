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
        self.tokenizer = self.model.tokenizer

    @modal.method()
    def embed(self, text: str) -> list[float]:
        encoded_text = self.model.encode(text)
        return encoded_text.tolist()

    @modal.method()
    def chunk_and_embed(self, sections: list[tuple[list[str], str]], max_seq_length:int, chunk_overlap: int) -> list[tuple[list[str], list[tuple[str, list[float]]]]]:
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
                    embedding = self.model.encode(heading_text + "\n" + content_text).tolist()
                    content_and_embedding_tuple = (content_text, embedding)
                    heading_path_and_embedding_tuple[1].append(content_and_embedding_tuple)

                    if i + content_budget >= len(content_encoded):
                        break
            else:
                embedding = self.model.encode(heading_text + "\n" + content).tolist()
                heading_path_and_embedding_tuple = (heading_path, [(content, embedding)])
        
            heading_path_and_content_embed_list.append(heading_path_and_embedding_tuple)

        return heading_path_and_content_embed_list