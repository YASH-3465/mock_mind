from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.interview_answer import InterviewAnswerRequest
from app.services.interview_answer_service import submit_answer

router = APIRouter(
    prefix="/answer",
    tags=["Interview Answers"]
)


@router.post("/")
def save_answer(
    request: InterviewAnswerRequest,
    db: Session = Depends(get_db),
):
    answer = submit_answer(
        db=db,
        session_id=request.session_id,
        question_number=request.question_number,
        answer_text=request.answer_text,
        answer_duration=request.answer_duration,
    )

    if answer is None:
        raise HTTPException(
            status_code=404,
            detail="Question not found."
        )

    return answer