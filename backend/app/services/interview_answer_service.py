from sqlalchemy.orm import Session

from app.models.interview_question import InterviewQuestion
from app.models.interview_answer import InterviewAnswer


def submit_answer(
    db: Session,
    session_id: int,
    question_number: int,
    answer_text: str,
    answer_duration: float,
):
    question = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.interview_session_id == session_id,
            InterviewQuestion.question_number == question_number
        )
        .first()
    )

    if not question:
        return None

    answer = InterviewAnswer(
        interview_question_id=question.id,
        answer_text=answer_text,
        answer_duration=answer_duration
    )

    db.add(answer)
    db.commit()
    db.refresh(answer)

    return answer