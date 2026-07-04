from pydantic import BaseModel


class InterviewQuestionResponse(BaseModel):
    question: str
    ideal_answer: str
    category: str
    difficulty: str
    expected_topics: list[str]

    class Config:
        from_attributes = True