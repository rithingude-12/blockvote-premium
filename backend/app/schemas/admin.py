from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from ..models.admin import AdminRole

class AdminBase(BaseModel):
    username: str
    email: EmailStr
    role: AdminRole
    is_active: bool = True

class AdminCreate(AdminBase):
    password: str

class AdminResponse(AdminBase):
    id: str
    mfa_enabled: bool
    last_login_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

class AdminUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[AdminRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
