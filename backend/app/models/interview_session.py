from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Float, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    resume_analysis_id: Mapped[int] = mapped_column(
        ForeignKey("resume_analysis.id"),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="IN_PROGRESS"
    )

    overall_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    analysis = relationship(
        "ResumeAnalysis",
        back_populates="sessions"
    )

    questions = relationship(
        "InterviewQuestion",
        back_populates="session"
    )
    user = relationship(
    "User",
    back_populates="sessions"
    )