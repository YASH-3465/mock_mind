from datetime import datetime
from pydantic import BaseModel


class ResumeResponse(BaseModel):
    id: int
    user_id: int
    file_name: str
    file_path: str
    resume_text: str | None
    uploaded_at: datetime

    class Config:
        from_attributes = True