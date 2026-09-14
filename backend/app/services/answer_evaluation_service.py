import json

from sqlalchemy.orm import Session
from google.api_core.exceptions import ResourceExhausted

from app.ai.gemini import model
from app.models.interview_answer import InterviewAnswer
from app.models.interview_question import InterviewQuestion
from app.prompts.answer_evaluation_prompt import ANSWER_EVALUATION_PROMPT


def evaluate_answer(
    db: Session,
    answer_id: int,
):
    answer = (
        db.query(InterviewAnswer)
        .filter(
            InterviewAnswer.id == answer_id
        )
        .first()
    )

    if not answer:
        return None

    question = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.id == answer.interview_question_id
        )
        .first()
    )

    if not question:
        return None

    prompt = ANSWER_EVALUATION_PROMPT.format(
        question=question.question,
        ideal_answer=question.ideal_answer,
        expected_topics=question.expected_topics,
        answer=answer.answer_text,
        answer_duration=answer.answer_duration,
    )

    try:
        response = model.generate_content(prompt)

    except ResourceExhausted:
        return {
            "status": "evaluation_unavailable",
            "answer_id": answer.id,
            "message": (
                "AI evaluation is temporarily unavailable "
                "because the Gemini API quota has been exceeded."
            ),
        }

    text = response.text.strip()

    if text.startswith("```json"):
        text = text.replace("```json", "", 1)
        text = text.replace("```", "")
        text = text.strip()

    evaluation = json.loads(text)

    answer.technical_score = evaluation["technical_score"]
    answer.communication_score = evaluation["communication_score"]
    answer.confidence_score = evaluation["confidence_score"]
    answer.overall_score = evaluation["overall_score"]

    answer.feedback = json.dumps({
        "feedback": evaluation["feedback"],
        "strengths": evaluation["strengths"],
        "improvements": evaluation["improvements"],
    })

    db.commit()
    db.refresh(answer)

    return answer