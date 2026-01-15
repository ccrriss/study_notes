from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import jwt, JWTError

from app.core.config import settings

def create_access_token(data: dict, expires_delta: Optional[timedelta]=None) -> str:
    # data: {"sub": username}
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else: 
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt

def decode_access_token(token:str) -> dict[str, Any]:
    # decode and verify token, JWTError if wrong
    payload = jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM]
    )

    return payload