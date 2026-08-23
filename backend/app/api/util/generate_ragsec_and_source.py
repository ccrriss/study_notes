from app.db.models import PostChunk
from app.schemas.rag import RagSource, RagSection
def generate_rag_sec_and_source(rows: list[tuple[PostChunk, float]]):
    rag_source_dict: dict[int, RagSource] = {}
    check_set: set[tuple[int, int]] = set() # for checking duplicate content
    
    for post_chunk, similarity in rows:
        post_id = post_chunk.post_id
        title = post_chunk.post.title
        slug = post_chunk.post.slug 
        
        heading_text = " > ".join(post_chunk.heading_path).strip() # list[str]
        content = post_chunk.content_chunk

        chunk_key = (post_chunk.post_id, post_chunk.chunk_idx)
        # check if duplicate just go ahead
        if chunk_key in check_set:
            continue
        else:
            check_set.add(chunk_key)

        rag_section = RagSection(heading=heading_text, content=content)

        if post_id in rag_source_dict:
            rag_source_dict[post_id].section_list.append(rag_section)
        else:
            rag_source_dict[post_id] = RagSource(title=title, slug=slug, section_list=[rag_section])

    return [rag_source_dict[post_id] for post_id in rag_source_dict]