from app.schemas.rag import RagSource, RagSection
from app.schemas.evaluation import RetrievedResult

def build_rag_sources(retrieved_results: list[RetrievedResult]) -> list[RagSource]:
    rag_source_dict: dict[int, RagSource] = {}

    for retrieved_result in retrieved_results:
        post_id = retrieved_result.post_id
        title = retrieved_result.title
        slug = retrieved_result.slug
        heading_text = " > ".join(retrieved_result.heading_path).strip()
        content = retrieved_result.content

        rag_section = RagSection(heading=heading_text, content=content)

        if post_id in rag_source_dict:
            rag_source_dict[post_id].section_list.append(rag_section)
        else:
            rag_source_dict[post_id] = RagSource(title=title, slug=slug, section_list=[rag_section])

    return [rag_source_dict[post_id] for post_id in rag_source_dict]