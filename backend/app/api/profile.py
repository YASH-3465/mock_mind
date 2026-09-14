from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.profile import ProfileCreate, ProfileResponse
from app.services.profile_service import (
    create_profile,
    get_profile,
    update_profile,
)


router = APIRouter(prefix="/profile", tags=["Profile"])


@router.post("", response_model=ProfileResponse)
def create_user_profile(
    profile: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return create_profile(db, current_user.id, profile)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.get("", response_model=ProfileResponse)
def read_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_profile(db, current_user.id)

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    return profile


@router.put("", response_model=ProfileResponse)
def edit_profile(
    profile: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updated_profile = update_profile(
        db,
        current_user.id,
        profile,
    )

    if not updated_profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    return updated_profile