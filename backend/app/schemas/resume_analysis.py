from pydantic import BaseModel
from datetime import datetime


class ResumeAnalysisResponse(BaseModel):
    id: int
    resume_id: int

    summary: str | None
    skills: str | None
    projects: str | None
    experience: str | None
    education: str | None
    certifications: str | None
    strengths: str | None
    weaknesses: str | None

    created_at: datetime

    class Config:
        from_attributes = True