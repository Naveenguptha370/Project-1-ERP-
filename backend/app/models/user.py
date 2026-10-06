from datetime import datetime, timezone
from typing import Optional, Set
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.audit_log import AuditLog

# Many-to-Many Association Tables
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("created_at", DateTime, default=lambda: datetime.now(timezone.utc)),
)

role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
    Column("created_at", DateTime, default=lambda: datetime.now(timezone.utc)),
)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    roles = relationship("Role", secondary=user_roles, back_populates="users", lazy="joined")
    audit_logs = relationship("AuditLog", back_populates="user")

    @property
    def permissions(self) -> Set[str]:
        if self.is_superuser:
            return {"*"}
        perms = set()
        for role in self.roles:
            for perm in role.permissions:
                perms.add(perm.code)
        return perms


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)  # ADMIN, MANAGER, EMPLOYEE
    description = Column(String(255), nullable=True)

    users = relationship("User", secondary=user_roles, back_populates="roles")
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles", lazy="joined")


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=True)
    code = Column(String(100), unique=True, index=True, nullable=False)
    module = Column(String(100), nullable=True, default="CORE")
    description = Column(String(255), nullable=True)

    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")
