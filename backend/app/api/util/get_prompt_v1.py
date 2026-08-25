from app.db.models import PostChunk

start = """You are answering a user's question using retrieved context.

"""

def get_prompt(user_query:str,combined_rows:list[tuple[PostChunk, float]]):
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