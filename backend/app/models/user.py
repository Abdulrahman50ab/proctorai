import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Enum
from app.core.database import Base

class UserRole(str, Enum):
    ADMIN = "admin"
    EXAMINER = "examiner"
    RECRUITER = "recruiter"
    CANDIDATE = "candidate"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="candidate", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
