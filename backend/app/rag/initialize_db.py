from sqlalchemy import select, text
import asyncio
from pathlib import Path
import sys
from sentence_transformers import SentenceTransformer
from models import PostChunk, RagBase

CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent.parent
sys.path.append(str(BACKEND_DIR))

from app.db.session import AsyncSessionLocal, Rag_AsyncSessionLocal, rag_engine
from app.db.models import Post
from transformers import PreTrainedTokenizerBase

async def init_rag_database():   
    create_db_text = text("CREATE EXTENSION IF NOT EXISTS vector;")

    async with rag_engine.begin() as rag_conn:
        await rag_conn.execute(create_db_text)
        
        await rag_conn.run_sync(RagBase.metadata.create_all)

async def main():
    await init_rag_database()

    await rag_engine.dispose()