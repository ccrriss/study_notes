from passlib.context import CryptContext

# 定义一个密码加密上下文，使用 argon2 算法, bcrypt在windows环境下有bug
pwd_context = CryptContext(schemes=["argon2"], deprecated = "auto")

def hash_password(password: str) -> str:
    # password to hash string
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
