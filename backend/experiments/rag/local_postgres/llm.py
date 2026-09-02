"""
This file is for local dev. And used in backend/app/rag/genetate_answer_v1.py
"""


from ollama import AsyncClient
import asyncio

MODEL_NAME = "qwen3:4b-instruct-2507-q4_K_M"

client = AsyncClient(
    trust_env=False)

rules = """1. Use only the information provided in the context.
2. Do not use external knowledge or invent information.
3. If the context does not contain enough information to answer the question,
   say \"I don't know based on the provided context.\"
4. If only part of the question can be answered, answer the supported part
   and state which part is not supported by the context but do not treat unasked details as missing parts.
5. If the sources conflict, clearly state the conflict instead of choosing
   or inventing an answer.
6. Answer the user's question directly and concisely.
   For a fully answerable question, provide only the answer and any explanation
   required to answer the question itself.
   Do not add meta-commentary such as "reason", "supporting evidence",
   "according to the context", "note", "supported part", "unsupported part",
   or "conclusion", unless required by Rules 3, 4, or 5.
"""

async def generate_answer(prompt: str) -> str:
    response = await client.chat(
        model=MODEL_NAME,
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
        options={
            "temperature": 0,
            "seed": 42,
            "num_ctx": 4096
        }
    )
    return response.message.content
