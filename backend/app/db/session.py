# import ssl
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings

# for docker database connection no ssl but for subabase database ssl is required
connect_args = {"ssl": "require" if settings.DATABASE_SSL else False}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo = False,
    connect_args = connect_args,
    # connect_args={"ssl": True} if "supabase" in settings.DATABASE_URL else {}, #asyncpg with ssl
)

# local postgres sql for testing, not docker
rag_engine = create_async_engine(
    settings.RAG_DATABASE_URL,
    echo = False,
    connect_args = {"ssl": False},
)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

# local pg, not docker
Rag_AsyncSessionLocal = async_sessionmaker(rag_engine, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session