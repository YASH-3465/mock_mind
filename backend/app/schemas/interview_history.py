from datetime import datetime

from pydantic import BaseModel


class InterviewHistoryItem(BaseModel):
    session_id: int
    resume_analysis_id: int
    status: str
    overall_score: float | None
    started_at: datetime | None
    completed_at: datetime | None
    question_count: int
    duration_seconds: int | None


class InterviewHistoryResponse(BaseModel):
    interviews: list[InterviewHistoryItem]
    total: int
