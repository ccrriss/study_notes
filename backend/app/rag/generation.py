from ollama import AsyncClient

GENERATION_MODEL_NAME = "qwen3:4b-instruct-2507-q4_K_M"

GENERATION_OPTIONS = {
    "temperature": 0,
    "seed": 42,
    "num_ctx": 4096
}

client = AsyncClient(
    trust_env=False)

async def generate_answer(prompt: str, rules: str) -> str:
    response = await client.chat(
        model=GENERATION_MODEL_NAME,
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
    return response.message.content
