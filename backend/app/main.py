from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.models import Base
from app.db.session import engine
from contextlib import asynccontextmanager
from app.api import posts, auth, tags

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ 数据库表结构创建完成")

    yield

    await engine.dispose()
    print("🧹 数据库连接已关闭")

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

@app.get("/health")
def health():
    return {"ok" : True}

# @app.on_event("startup")
# async def on_startup():
#     async with engine.begin() as conn:
#         await conn.run_sync(Base.metadata.create_all)

