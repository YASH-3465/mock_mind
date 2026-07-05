from pydantic import BaseModel


class InterviewAnswerRequest(BaseModel):
    session_id: int
    question_number: int
    answer_text: str
    answer_duration: float