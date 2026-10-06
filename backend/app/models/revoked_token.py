from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database.session import Base


class RevokedToken(Base):
    __tablename__ = "revoked_tokens"

    jti = Column(String(128), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    revoked_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
