from datetime import datetime
from pydoc import text

from sqlalchemy import DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class ResumeAnalysis(Base):
    __tablename__ = "resume_analysis"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    resume_id: Mapped[int] = mapped_column(
        ForeignKey("resumes.id"),
        unique=True,
        nullable=False
    )

    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    skills: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    projects: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    experience: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    education: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    certifications: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    strengths: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    weaknesses: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    resume = relationship(
        "Resume",
        back_populates="analysis"
    )