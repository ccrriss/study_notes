from app.db.models import PostChunk

start = """You are answering a user's question using retrieved context.

"""

rules = """
1. Use only the information provided in the context.
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

def build_prompt(user_query:str,combined_rows:list[tuple[PostChunk, float]]):
    combined_prompt_text = (
        start
        + f"User question:\n{user_query}\n\n"
        + f"Context:\n\n"
    )

    for i, (combined_post_chunk, similarity) in enumerate(combined_rows):
        combined_prompt_text += (
            f"[Source {i+1}]\n"
            f"Heading: {' > '.join(combined_post_chunk.heading_path).strip()}\n"
            f"Content:\n{combined_post_chunk.content_chunk}\n\n"
        )
    return combined_prompt_text