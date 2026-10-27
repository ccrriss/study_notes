import pytest
from app.rag.ingestion.post_chunks import generate_sections, generate_post_chunks
from app.db.models import Post, PostChunk

"""
Arrage:
- create post1 for testing headings
- create post2 for testing code block
- create expected_sections for checking

- create post for generate post_chunks
- create FakeEmbeddingProvider for generate embedding
- create expected_post_chunks structure for checking

Act:
1. Use the post to generate sections
2. Use the post to generate post_chunks

Assert:
generate_sections:
- check whether the generated sections is equal to expected_sections

generate_post_chunks:
- check whether the generated post_chunks are equal to expected_post_chunks

"""


post1 = Post(
    title="test",
    slug="test-generate-sections",
    content_md="""Introduction content

# Python
Python content

## Async
Async content

# RAG
RAG content
""",
    excerpt="test"
)

expected_sections1 = [
    (
        [],
        "Introduction content"
    ),
    (
        ["Python"],
        "Python content"
    ),
    (
        ["Python", "Async"],
        "Async content"
    ),
    (
        ["RAG"],
        "RAG content"
    ),
]

content_md = (
    "# Python\n\n"
    "Before code\n\n"
    "```python\n"
    "# this is not a heading\n"
    'print("hello")\n'
    "```\n\n"
    "After code"
)

post2 = Post(
    title="test",
    slug="test-code-block",
    content_md=content_md,
    excerpt="test"
)

expected_sections2 = [
    (
        ["Python"],
        (
            "Before code\n\n"
            "```python\n"
            "# this is not a heading\n"
            'print("hello")\n'
            "```\n\n"
            "After code"
        )
    )
]

def test_generate_sections():
    generated_sections1 = generate_sections(post=post1)
    generated_sections2 = generate_sections(post=post2)

    assert generated_sections1 == expected_sections1
    assert generated_sections2 == expected_sections2

embedding_1 = [1.0] + [0.0] * 383
embedding_2 = [0.0, 1.0] + [0.0] * 382
embedding_3 = [0.0, 0.0, 1.0] + [0.0] * 381

class FakeEmbeddingModel:
    async def chunk_and_embed(self, sections: list[tuple[list[str], str]], max_seq_length: int, chunk_overlap: int):
        assert sections == [([], "test content")]
        
        return [
            (['Python'], [("chunk A", embedding_1), ("chunk B", embedding_2)]),
            (['RAG'], [("chunk C", embedding_3)])
        ]

@pytest.mark.anyio
async def test_generate_post_chunks():
    post = Post(
        id=123,
        title="test",
        slug="test-generate-post-chunks",
        content_md="test content",
        excerpt="test",
    )

    expected = [
        {
            "post_id": 123,
            "chunk_idx": 0,
            "content_chunk": "chunk A",
            "heading_path": ["Python"],
            "combined_embedding": embedding_1,
        },
        {
            "post_id": 123,
            "chunk_idx": 1,
            "content_chunk": "chunk B",
            "heading_path": ["Python"],
            "combined_embedding": embedding_2,
        },
        {
            "post_id": 123,
            "chunk_idx": 2,
            "content_chunk": "chunk C",
            "heading_path": ["RAG"],
            "combined_embedding": embedding_3,
        },
    ]

    post_chunks = await generate_post_chunks(post=post, model=FakeEmbeddingModel(), max_seq_length=100, chunk_overlap=10)

    assert len(post_chunks) == 3
    actual = [{
        "post_id": post_chunk.post_id,
        "chunk_idx": post_chunk.chunk_idx,
        "content_chunk": post_chunk.content_chunk,
        "heading_path": post_chunk.heading_path,
        "combined_embedding": post_chunk.combined_embedding,
    } for post_chunk in post_chunks]

    assert actual == expected
   