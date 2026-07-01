from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.jwt import verify_token
from app.db.database import get_db
from app.models.user import User
from app.schemas.profile import ProfileCreate, ProfileResponse
from app.services.profile_service import create_profile
from app.services.profile_service import (
    create_profile,
    get_profile,
    update_profile,
)

router = APIRouter(prefix="/profile", tags=["Profile"])

security = HTTPBearer()


@router.post("", response_model=ProfileResponse)
def create_user_profile(
    profile: ProfileCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    email = verify_token(credentials.credentials)

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        return create_profile(db, user.id, profile)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("", response_model=ProfileResponse)
def read_profile(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    email = verify_token(credentials.credentials)

    user = db.query(User).filter(User.email == email).first()

    profile = get_profile(db, user.id)

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile

@router.put("", response_model=ProfileResponse)
def edit_profile(
    profile: ProfileCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    email = verify_token(credentials.credentials)

    user = db.query(User).filter(User.email == email).first()

    updated_profile = update_profile(db, user.id, profile)

    if not updated_profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return updated_profile