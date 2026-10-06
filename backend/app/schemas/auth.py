from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict, computed_field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None


class UserLogin(BaseModel):
    username_or_email: str
    password: str


class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)
    confirm_password: Optional[str] = None
    role: Optional[str] = "EMPLOYEE"  # ADMIN, MANAGER, EMPLOYEE

    def model_post_init(self, __context):
        if not self.confirm_password:
            self.confirm_password = self.password


class RoleOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PermissionOut(BaseModel):
    id: int
    code: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserOut(BaseModel):
    id: int
    full_name: str
    username: str
    email: str
    is_active: bool
    roles: List[RoleOut] = []
    created_at: Optional[datetime] = None

    @computed_field
    @property
    def role(self) -> str:
        if self.roles:
            return self.roles[0].name
        return "EMPLOYEE"

    model_config = ConfigDict(from_attributes=True)


Token.model_rebuild()
