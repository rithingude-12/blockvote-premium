from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from ..database import get_db
from ..models.admin import Admin
from ..schemas.auth import Token, LoginRequest
from ..schemas.admin import AdminResponse
from ..middleware.auth import verify_password, create_access_token, get_current_admin
from ..config import settings

router = APIRouter()

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    try:
        admin = db.query(Admin).filter(Admin.username == request.username).first()
    except Exception as e:
        import traceback
        raise HTTPException(
            status_code=500,
            detail=f"DB Error: {str(e)}\n\nTraceback: {traceback.format_exc()}"
        )
    
    if not admin or not verify_password(request.password, admin.password_hash):

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not admin.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    admin.last_login_at = datetime.utcnow()
    db.commit()

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": admin.username, "role": admin.role.value}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=AdminResponse)
def read_users_me(current_admin: Admin = Depends(get_current_admin)):
    return current_admin
