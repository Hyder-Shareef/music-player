from typing import Optional
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, Header
from app.api.deps import get_db_repo, get_current_user
from app.repositories.base import BaseRepository
from app.services.auth.auth_service import auth_service
from app.models.user import User

router = APIRouter()

class GoogleLoginRequest(BaseModel):
    email: str
    name: Optional[str] = None
    avatar: Optional[str] = None
    google_id: Optional[str] = None

class AuthResponse(BaseModel):
    token: str
    user: User

@router.post("/google", response_model=AuthResponse)
async def login_with_google(
    payload: GoogleLoginRequest,
    repo: BaseRepository = Depends(get_db_repo)
):
    if not payload.email or "@" not in payload.email:
        raise HTTPException(status_code=400, detail="A valid email address is required")
    
    clean_email = payload.email.strip().lower()
    display_name = payload.name or clean_email.split("@")[0].capitalize()
    
    user = await repo.get_or_create_user_by_email(
        email=clean_email,
        name=display_name,
        avatar=payload.avatar
    )
    
    token = auth_service.create_access_token({"sub": user.id, "email": user.email})
    return AuthResponse(token=token, user=user)

@router.get("/me", response_model=User)
async def get_authenticated_user(user: User = Depends(get_current_user)):
    return user
