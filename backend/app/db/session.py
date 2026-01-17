# import ssl
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("postgresql+asyncpg://"):
    connect_args = {"ssl": "require"}  # Example for setting SSL mode

engine = create_async_engine(
    settings.DATABASE_URL,
    future = True, 
    echo = False,
    connect_args = connect_args,
    # connect_args={"ssl": True} if "supabase" in settings.DATABASE_URL else {}, #asyncpg with ssl
)

AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session