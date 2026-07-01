from sqlalchemy import ForeignKey, Integer, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    college: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    branch: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    graduation_year: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    cgpa: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    skills: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    experience_level: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    target_role: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    linkedin_url: Mapped[str] = mapped_column(
        String(255),
        nullable=True
    )

    github_url: Mapped[str] = mapped_column(
        String(255),
        nullable=True
    )

    portfolio_url: Mapped[str] = mapped_column(
        String(255),
        nullable=True
    )

    bio: Mapped[str] = mapped_column(
        Text,
        nullable=True
    )

    user = relationship(
        "User",
        back_populates="profile"
    )