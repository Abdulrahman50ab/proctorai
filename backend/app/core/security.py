import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
from jose import jwt
from app.core.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if isinstance(plain_password, str):
        plain_password_bytes = plain_password.encode('utf-8')
    else:
        plain_password_bytes = plain_password

    if isinstance(hashed_password, str):
        hashed_password_bytes = hashed_password.encode('utf-8')
    else:
        hashed_password_bytes = hashed_password

    try:
        return bcrypt.checkpw(plain_password_bytes, hashed_password_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    if isinstance(password, str):
        password_bytes = password.encode('utf-8')
    else:
        password_bytes = password

    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def create_access_token(subject: Union[str, Any], role: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
