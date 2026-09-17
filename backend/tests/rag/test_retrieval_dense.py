"""
Deprecated

from app.rag.retrieval_dense import retrieve_dense_chunks
from unittest.mock import MagicMock, AsyncMock
from sentence_transformers import SentenceTransformer
from sqlalchemy.ext.asyncio import AsyncSession

fake_embedding_model = MagicMock(spec=SentenceTransformer)

fake_embedding_model.encode.return_value.tolist.return_value = [0.1, 0.2, 0.3]

fake_db = AsyncMock(spec=AsyncSession)

fake_result = MagicMock()
fake_result.all.return_value = [
    ("row1", 0.9),
    ("row2", 0.8)
]

fake_db.execute.return_value = fake_result

async def test_retrieve_dense_chunks():
    results = await retrieve_dense_chunks(query="test query", embedding_model=fake_embedding_model, db=fake_db, top_k=3)
    assert len(results) == 2
    assert results[0][1] > results[1][1]
"""


