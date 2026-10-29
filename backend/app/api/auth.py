from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.schemas.login import LoginIn, TokenOut

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError

from app.core.config import settings
from app.core.auth import create_access_token, decode_access_token
from app.core.security import verify_password
from app.db.session import get_db
from app.db.models import User

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

async def authenticate_user(username: str, password: str, db: AsyncSession) -> User:
    user = await db.scalar(select(User).where(User.username == username))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password",
        )

    if not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password"
        )

    return user

# 登录接口
@router.post("/login", response_model=TokenOut)
async def login(payload: LoginIn, db:AsyncSession = Depends(get_db)) -> TokenOut:
    user = await authenticate_user(username=payload.username, password=payload.password, db=db)

    # payload中的sub放user.id
    access_token = create_access_token(
        data={"sub": str(user.id)},
    )
    return TokenOut(access_token=access_token, username=user.username, is_admin=user.is_admin)

# for swagger only since the request sent to token url is application/x-www-form-urlencoded but login accept application/json
@router.post("/token", response_model=TokenOut)
async def swagger_login(payload_form: Annotated[OAuth2PasswordRequestForm, Depends()], db:AsyncSession = Depends(get_db)) -> TokenOut:
    user = await authenticate_user(username=payload_form.username, password=payload_form.password, db=db)

    # payload中的sub放user.id
    access_token = create_access_token(
        data={"sub": str(user.id)},
    )
    return TokenOut(access_token=access_token, username=user.username, is_admin=user.is_admin)

# 从token找到User(底层工具)
async def get_user_by_token(
        token: str,
        db: AsyncSession
) -> User:
    try: 
        payload = decode_access_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    user = await db.get(User, int(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user

# FastAPI 依赖: 获取当前用户
async def get_current_user(
        token: Annotated[str, Depends(oauth2_scheme)],
        db: AsyncSession = Depends(get_db)
) -> User:
    return await get_user_by_token(token, db)

# FastAPI 依赖: 必须是admin用户
async def require_admin_user(
        current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user