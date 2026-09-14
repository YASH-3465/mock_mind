from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.db.database import get_db
from app.services.interview_service import generate_interview_questions
from app.services.interview_service import complete_interview
from app.services.interview_service import get_interview_progress


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
    result = complete_interview(
        db=db,
        session_id=session_id,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found."
        )

    if "error" in result:
        raise HTTPException(
            status_code=400,
            detail=result["error"]
        )

    return result

@router.get("/{session_id}/progress")
def interview_progress(
    session_id: int,
    db: Session = Depends(get_db),
):
    result = get_interview_progress(
        db=db,
        session_id=session_id,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found."
        )

    return result

