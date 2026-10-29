import os
import asyncio

from app.db.session import AsyncSessionLocal
from app.db.models import User
from app.core.security import hash_password

async def main():
    username = os.getenv("DEMO_USERNAME", "user")
    password = os.getenv("DEMO_PASSWORD", "user")

    async with AsyncSessionLocal() as db:
        user = User(
            username=username,
            password_hash = hash_password(password),
            is_admin=False,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        print("Created user with id =", user.id)

if __name__ == "__main__":
    asyncio.run(main())