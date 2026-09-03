from ollama import AsyncClient

MODEL_NAME = "qwen3:4b-instruct-2507-q4_K_M"

client = AsyncClient(trust_env = False)

options = {
    "temperature": 0,
    "seed": 42,
    "num_ctx": 4096
}

async def judge(prompt: str, rules:str) -> str:
    response = await client.chat(
        model=MODEL_NAME,
        messages=[
            {
                'role': 'system',
                'content': rules
            },
            {
                'role': 'user',
                'content': prompt
            }
        ],
        options = options
    )
    return response.message.content
