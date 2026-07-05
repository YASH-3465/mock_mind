import json

from sqlalchemy.orm import Session

from app.ai.gemini import model
from app.models.resume_analysis import ResumeAnalysis
from app.models.interview_question import InterviewQuestion
from app.prompts.interview_prompt import INTERVIEW_QUESTION_PROMPT
from app.models.interview_session import InterviewSession


def generate_interview_questions(
    db: Session,
    analysis_id: int,
):
    # Get AI analysis
    analysis = (
        db.query(ResumeAnalysis)
        .filter(
            ResumeAnalysis.id == analysis_id
        )
        .first()
    )

    if not analysis:
        return None
    
    session = InterviewSession(
        user_id=analysis.resume.user_id,
        resume_analysis_id=analysis.id
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    

    analysis_text = f"""
Summary:
{analysis.summary}

Skills:
{analysis.skills}

Projects:
{analysis.projects}

Experience:
{analysis.experience}

Education:
{analysis.education}

Strengths:
{analysis.strengths}

Weaknesses:
{analysis.weaknesses}
"""

    prompt = INTERVIEW_QUESTION_PROMPT.format(
        analysis=analysis_text
    )

    response = model.generate_content(prompt)

    text = response.text.strip()

    if text.startswith("```json"):
        text = text.replace("```json", "")
        text = text.replace("```", "")
        text = text.strip()

    questions = json.loads(text)

    saved_questions = []

    for index, q in enumerate(questions, start=1):

        question = InterviewQuestion(
            interview_session_id=session.id,
            question_number=index,
            question=q["question"],
            ideal_answer=q["ideal_answer"],
            category=q["category"],
            difficulty=f"Round {q['round']}",
            expected_topics=json.dumps(q["expected_topics"])
        )

        db.add(question)
        saved_questions.append(question)

    db.commit()

    for question in saved_questions:
        db.refresh(question)

    return {
        "session_id": session.id,
        "questions": saved_questions
    }