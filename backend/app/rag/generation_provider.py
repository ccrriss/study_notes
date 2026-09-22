from app.rag.generation import GENERATION_MODEL_NAME as LOCAL_GENERATION_MODEL_NAME, GENERATION_OPTIONS
from app.core.config import settings

class OllamaGenerationProvider:
    def __init__(self):
        from ollama import AsyncClient
        self.client = AsyncClient(trust_env=False)    

    async def generate_answer(self, prompt: str, rules: str) -> str:
        response = await self.client.chat(
            model=LOCAL_GENERATION_MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": rules
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            options=GENERATION_OPTIONS
        )

        content = response.message.content

        if content is None:
            raise RuntimeError("Ollama returned empty content")
        return content

class QwenGenerationProvider:
    def __init__(self):
        from openai import AsyncOpenAI
        self.client = AsyncOpenAI(api_key=settings.QWEN_API_KEY, base_url=settings.QWEN_BASE_URL)

    async def generate_answer(self, prompt: str, rules: str) -> str:
        response = await self.client.chat.completions.create(
            model=settings.QWEN_MODEL_NAME,
            messages = [
                {
                    "role": "system",
                    "content": rules
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=GENERATION_OPTIONS["temperature"],
            seed=GENERATION_OPTIONS["seed"],
        )

        content = response.choices[0].message.content

        if content is None:
            raise RuntimeError("Qwen returned empty content")
        return response.choices[0].message.content

GenerationProvider = OllamaGenerationProvider | QwenGenerationProvider