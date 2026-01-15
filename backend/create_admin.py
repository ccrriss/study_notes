import asyncio

from app.db.session import AsyncSessionLocal
from app.db.models import User
from app.core.security import hash_password

async def main():
    async with AsyncSessionLocal() as db:
        user = User(
            username="admin",
            password_hash = hash_password("admin123"),
            is_admin=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        print("Created admin user with id =", user.id)

if __name__ == "__main__":
    asyncio.run(main())