from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    interview_question_id: Mapped[int] = mapped_column(
        ForeignKey("interview_questions.id"),
        nullable=False,
        unique=True
    )

    answer_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    answer_duration: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    confidence_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    technical_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    communication_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    overall_score: Mapped[float | None] = mapped_column(
    Float,
    nullable=True
    )

    feedback: Mapped[str | None] = mapped_column(
    Text,
    nullable=True
    )

    question = relationship(
        "InterviewQuestion",
        back_populates="answer"
    )