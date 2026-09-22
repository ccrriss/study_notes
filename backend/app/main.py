from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.models import Base
from app.db.session import engine
from contextlib import asynccontextmanager
from app.api import posts, auth, tags, rag

# lexical search
from app.db.session import AsyncSessionLocal
from app.rag.retrieval_lexical import build_lexical_search_corpus
from rank_bm25 import BM25Okapi

# for deployment
from app.rag.embedding_provider import LocalEmbeddingProvider, ModalEmbeddingProvider
from fastapi import status, HTTPException
from app.rag.reranking_provider import LocalRerankingProvider, ModalRerankingProvider
from app.rag.generation_provider import OllamaGenerationProvider, QwenGenerationProvider

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("START lifespan")

    # for local, only when AUTO_CREATE_TABLES is True
    if settings.AUTO_CREATE_TABLES: 
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("AUTO_CREATE_TABLES is enabled, all tables are created")
    print("TABLES done")

    print("START lexical corpus")
    async with AsyncSessionLocal() as db:
        post_chunk_ids, tokenized_corpus = await build_lexical_search_corpus(db)
    print("CORPUS done")

    print("START BM25")
    bm25 = BM25Okapi(corpus=tokenized_corpus)
    print("BM25 done")

    print("START embedding provider")
    if settings.INFERENCE_MODE == "local":
        embedding_model = LocalEmbeddingProvider()
        reranking_model = LocalRerankingProvider()
        generation_model = OllamaGenerationProvider()
    elif settings.INFERENCE_MODE == "modal":
        embedding_model = ModalEmbeddingProvider()
        reranking_model = ModalRerankingProvider()
        generation_model = QwenGenerationProvider()
    else:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="constructing model internal error")
    print("EMBEDDING provider done")

    app.state.bm25 = bm25
    app.state.post_chunk_ids = post_chunk_ids
    app.state.embedding_model = embedding_model
    app.state.reranking_model = reranking_model
    app.state.generation_model = generation_model

    yield

    await engine.dispose()
    print("database engine disposed")

app = FastAPI(title= settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins = settings.BACKEND_CORS_ORIGINS,
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"]
)

app.include_router(posts.router)
app.include_router(auth.router)
app.include_router(tags.router)
app.include_router(rag.router)