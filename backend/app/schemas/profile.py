from pydantic import BaseModel, HttpUrl


class ProfileCreate(BaseModel):
    college: str
    branch: str
    graduation_year: int
    cgpa: float
    skills: str
    experience_level: str
    target_role: str
    linkedin_url: HttpUrl | None = None
    github_url: HttpUrl | None = None
    portfolio_url: HttpUrl | None = None
    bio: str | None = None


class ProfileResponse(ProfileCreate):
    id: int
    user_id: int

    class Config:
        from_attributes = True