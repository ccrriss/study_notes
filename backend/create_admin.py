import os
import asyncio

from app.db.session import AsyncSessionLocal
from app.db.models import User
from app.core.security import hash_password

async def main():
    username = os.getenv("ADMIN_USERNAME")
    password = os.getenv("ADMIN_PASSWORD")

    if not username or not username.strip() or not password or not password.strip():
        raise RuntimeError( "ADMIN_USERNAME and ADMIN_PASSWORD must be set")

    async with AsyncSessionLocal() as db:
        user = User(
            username=username,
            password_hash = hash_password(password),
            is_admin=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        print("Created admin user with id =", user.id)

if __name__ == "__main__":
    asyncio.run(main())