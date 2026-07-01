from sqlalchemy.orm import Session

from app.models.profile import Profile
from app.schemas.profile import ProfileCreate


def create_profile(
    db: Session,
    user_id: int,
    profile: ProfileCreate
):
    existing_profile = (
        db.query(Profile)
        .filter(Profile.user_id == user_id)
        .first()
    )

    if existing_profile:
        raise ValueError("Profile already exists")

    new_profile = Profile(
        user_id=user_id,
        college=profile.college,
        branch=profile.branch,
        graduation_year=profile.graduation_year,
        cgpa=profile.cgpa,
        skills=profile.skills,
        experience_level=profile.experience_level,
        target_role=profile.target_role,
        linkedin_url=str(profile.linkedin_url) if profile.linkedin_url else None,
        github_url=str(profile.github_url) if profile.github_url else None,
        portfolio_url=str(profile.portfolio_url) if profile.portfolio_url else None,
        bio=profile.bio,
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return new_profile


def get_profile(db: Session, user_id: int):
    return (
        db.query(Profile)
        .filter(Profile.user_id == user_id)
        .first()
    )


def update_profile(db: Session, user_id: int, profile: ProfileCreate):
    existing_profile = (
        db.query(Profile)
        .filter(Profile.user_id == user_id)
        .first()
    )

    if not existing_profile:
        return None

    existing_profile.college = profile.college
    existing_profile.branch = profile.branch
    existing_profile.graduation_year = profile.graduation_year
    existing_profile.cgpa = profile.cgpa
    existing_profile.skills = profile.skills
    existing_profile.experience_level = profile.experience_level
    existing_profile.target_role = profile.target_role
    existing_profile.linkedin_url = str(profile.linkedin_url) if profile.linkedin_url else None
    existing_profile.github_url = str(profile.github_url) if profile.github_url else None
    existing_profile.portfolio_url = str(profile.portfolio_url) if profile.portfolio_url else None
    existing_profile.bio = profile.bio

    db.commit()
    db.refresh(existing_profile)

    return existing_profile