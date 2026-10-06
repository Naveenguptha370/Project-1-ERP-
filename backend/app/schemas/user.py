from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class PermissionResponse(BaseModel):
    id: int
    name: str
    code: str
    module: str

    model_config = ConfigDict(from_attributes=True)

class RoleResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    permissions: list[PermissionResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    email: str
    username: str
    full_name: str
    is_active: bool = True

class UserCreate(UserBase):
    password: str
    roles: list[str] | None = Field(default_factory=list)

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        v = v.strip().lower()
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email format")
        return v

class UserResponse(UserBase):
    id: int
    is_superuser: bool
    created_at: datetime
    roles: list[RoleResponse] = Field(default_factory=list)
    permissions: list[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
