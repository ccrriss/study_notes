"""
This file is for local dev. And works for local pg database.
"""

from sqlalchemy import text
import asyncio
from pathlib import Path
import sys
from backend.app.rag.local.models import RagBase

CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent.parent
sys.path.append(str(BACKEND_DIR))

from app.db.session import rag_engine

async def init_rag_database():   
    create_db_text = text("CREATE EXTENSION IF NOT EXISTS vector;")

    async with rag_engine.begin() as rag_conn:
        await rag_conn.execute(create_db_text)
        
        await rag_conn.run_sync(RagBase.metadata.create_all)

async def main():
    await init_rag_database()

    await rag_engine.dispose()