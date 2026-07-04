from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.interview_service import generate_interview_questions

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