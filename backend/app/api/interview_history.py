from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.jwt import verify_token
from app.db.database import get_db
from app.models.interview_session import InterviewSession
from app.models.user import User

router = APIRouter(
    prefix="/interview-history",
    tags=["Interview History"],
)

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    email = verify_token(credentials.credentials)
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    return user


@router.get("/")
def get_interview_history(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    sessions = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.user_id == user.id,
            InterviewSession.status == "COMPLETED",
        )
        .order_by(InterviewSession.completed_at.desc())
        .all()
    )

    history = []

    for session in sessions:
        question_count = len(session.questions)

        duration_seconds = None
        if session.started_at and session.completed_at:
            duration_seconds = int(
                (session.completed_at - session.started_at).total_seconds()
            )

        history.append(
            {
                "session_id": session.id,
                "resume_analysis_id": session.resume_analysis_id,
                "status": session.status,
                "overall_score": session.overall_score,
                "started_at": session.started_at,
                "completed_at": session.completed_at,
                "question_count": question_count,
                "duration_seconds": duration_seconds,
            }
        )

    return {
        "interviews": history,
        "total": len(history),
    }
