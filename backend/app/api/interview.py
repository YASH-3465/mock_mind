from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.db.database import get_db
from app.services.interview_service import generate_interview_questions
from app.services.interview_service import complete_interview


router = APIRouter(
    prefix="/interview",
    tags=["Interview"]
)


@router.post("/{analysis_id}")
def generate_questions(
    analysis_id: int,
    db: Session = Depends(get_db)
):
    return generate_interview_questions(
        db,
        analysis_id
    )



@router.post("/{session_id}/complete")
def finish_interview(
    session_id: int,
    db: Session = Depends(get_db),
):
    session = complete_interview(
        db=db,
        session_id=session_id,
    )

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found."
        )

    return {
        "message": "Interview completed successfully.",
        "session_id": session.id,
        "status": session.status,
        "completed_at": session.completed_at
    }