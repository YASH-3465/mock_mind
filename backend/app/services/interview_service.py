import json

from sqlalchemy.orm import Session


from app.ai.gemini import model
from app.models.resume_analysis import ResumeAnalysis
from app.models.interview_question import InterviewQuestion
from app.models.interview_answer import InterviewAnswer
from google.api_core.exceptions import ResourceExhausted
from app.prompts.interview_prompt import INTERVIEW_QUESTION_PROMPT
from app.services.interview_evaluation_service import evaluate_interview
from app.models.interview_session import InterviewSession
from datetime import datetime




def complete_interview(
    db: Session,
    session_id: int,
):
    session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.id == session_id
        )
        .first()
    )

    if not session:
        return None

    questions = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.interview_session_id == session_id
        )
        .order_by(
            InterviewQuestion.question_number
        )
        .all()
    )

    if not questions:
        return {
            "error": "No interview questions found for this session."
        }

    total_questions = len(questions)

    answers = []

    for question in questions:

        answer = (
            db.query(InterviewAnswer)
            .filter(
                InterviewAnswer.interview_question_id == question.id
            )
            .first()
        )

        if not answer or not answer.answer_text:
            return {
                "error": "Interview cannot be completed.",
                "reason": (
                    f"Question {question.question_number} "
                    "has not been answered."
                ),
                "total_questions": total_questions
            }

        answers.append(answer)

    # ------------------------------------------------
    # EVALUATE ENTIRE INTERVIEW IN ONE GEMINI CALL
    # ------------------------------------------------

    evaluation_result = evaluate_interview(
        db=db,
        session_id=session_id
    )

    if not evaluation_result:
        return {
            "error": "Interview evaluation failed."
        }

    if evaluation_result.get("status") == "incomplete":
        return {
            "error": "Interview cannot be completed.",
            "reason": evaluation_result["message"]
        }
    
    if evaluation_result.get("status") == "evaluation_unavailable":
        return {
        "error": "Interview evaluation is temporarily unavailable.",
        "reason": evaluation_result["message"]
        }

    # ------------------------------------------------
    # CALCULATE FINAL SCORES
    # ------------------------------------------------

    evaluated_answers = (
        db.query(InterviewAnswer)
        .join(InterviewQuestion)
        .filter(
            InterviewQuestion.interview_session_id == session_id
        )
        .all()
    )

    technical_scores = [
        a.technical_score
        for a in evaluated_answers
        if a.technical_score is not None
    ]

    communication_scores = [
        a.communication_score
        for a in evaluated_answers
        if a.communication_score is not None
    ]

    confidence_scores = [
        a.confidence_score
        for a in evaluated_answers
        if a.confidence_score is not None
    ]

    overall_scores = [
        a.overall_score
        for a in evaluated_answers
        if a.overall_score is not None
    ]

    technical_average = (
        sum(technical_scores) / len(technical_scores)
        if technical_scores else 0
    )

    communication_average = (
        sum(communication_scores) / len(communication_scores)
        if communication_scores else 0
    )

    confidence_average = (
        sum(confidence_scores) / len(confidence_scores)
        if confidence_scores else 0
    )

    overall_average = (
        sum(overall_scores) / len(overall_scores)
        if overall_scores else 0
    )

    session.overall_score = round(
        overall_average,
        2
    )

    session.status = "COMPLETED"

    session.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(session)

    return {
        "session_id": session.id,
        "status": session.status,
        "completed_at": session.completed_at,
        "total_questions": total_questions,
        "answered_questions": len(answers),
        "evaluated_answers": len(evaluated_answers),
        "technical_score": round(
            technical_average,
            2
        ),
        "communication_score": round(
            communication_average,
            2
        ),
        "confidence_score": round(
            confidence_average,
            2
        ),
        "overall_score": round(
            overall_average,
            2
        )
    }

def get_interview_progress(
    db: Session,
    session_id: int,
):
    session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.id == session_id
        )
        .first()
    )

    if not session:
        return None

    questions = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.interview_session_id == session_id
        )
        .order_by(
            InterviewQuestion.question_number
        )
        .all()
    )

    answered_questions = 0
    evaluated_answers = 0

    question_status = []

    for question in questions:

        answer = (
            db.query(InterviewAnswer)
            .filter(
                InterviewAnswer.interview_question_id == question.id
            )
            .first()
        )

        answered = (
            answer is not None
            and bool(answer.answer_text)
        )

        evaluated = (
            answered
            and answer.overall_score is not None
        )

        if answered:
            answered_questions += 1

        if evaluated:
            evaluated_answers += 1

        question_status.append({
            "question_number": question.question_number,
            "question_id": question.id,
            "question": question.question,
            "answered": answered,
            "evaluated": evaluated,
        })

    total_questions = len(questions)

    return {
        "session_id": session.id,
        "status": session.status,
        "total_questions": total_questions,
        "answered_questions": answered_questions,
        "evaluated_answers": evaluated_answers,
        "remaining_questions": total_questions - answered_questions,
        "can_complete": (
    total_questions > 0
    and answered_questions == total_questions
),
        "questions": question_status,
    }

def get_interview_history(
    db: Session,
    user_id: int,
):
    sessions = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.user_id == user_id,
            InterviewSession.status == "COMPLETED",
        )
        .order_by(
            InterviewSession.completed_at.desc()
        )
        .all()
    )

    history = []

    for session in sessions:

        questions = (
            db.query(InterviewQuestion)
            .filter(
                InterviewQuestion.interview_session_id == session.id
            )
            .order_by(
                InterviewQuestion.question_number
            )
            .all()
        )

        answers = (
            db.query(InterviewAnswer)
            .join(InterviewQuestion)
            .filter(
                InterviewQuestion.interview_session_id == session.id
            )
            .all()
        )

        technical_scores = [
            answer.technical_score
            for answer in answers
            if answer.technical_score is not None
        ]

        communication_scores = [
            answer.communication_score
            for answer in answers
            if answer.communication_score is not None
        ]

        confidence_scores = [
            answer.confidence_score
            for answer in answers
            if answer.confidence_score is not None
        ]

        history.append({
            "session_id": session.id,
            "status": session.status,
            "started_at": session.started_at,
            "completed_at": session.completed_at,
            "total_questions": len(questions),
            "answered_questions": len(answers),
            "technical_score": round(
                sum(technical_scores) / len(technical_scores),
                2
            ) if technical_scores else 0,
            "communication_score": round(
                sum(communication_scores) / len(communication_scores),
                2
            ) if communication_scores else 0,
            "confidence_score": round(
                sum(confidence_scores) / len(confidence_scores),
                2
            ) if confidence_scores else 0,
            "overall_score": session.overall_score or 0,
        })

    return history


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

    try:
        response = model.generate_content(prompt)

    except ResourceExhausted:
        return {
            "status": "evaluation_unavailable",
            "message": (
                "AI evaluation is temporarily unavailable "
                "because the Gemini API quota has been exceeded."
            )
        }

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

def get_interview_result(
    db: Session,
    session_id: int,
    user_id: int,
):
    session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.id == session_id,
            InterviewSession.user_id == user_id,
        )
        .first()
    )

    if not session:
        return None

    questions = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.interview_session_id == session.id
        )
        .order_by(
            InterviewQuestion.question_number
        )
        .all()
    )

    question_results = []

    for question in questions:

        answer = (
            db.query(InterviewAnswer)
            .filter(
                InterviewAnswer.interview_question_id == question.id
            )
            .first()
        )

        question_results.append({
            "question_number": question.question_number,
            "question_id": question.id,
            "question": question.question,

            "answer": (
                answer.answer_text
                if answer
                else None
            ),

            "answer_duration": (
                answer.answer_duration
                if answer
                else None
            ),

            "technical_score": (
                answer.technical_score
                if answer and answer.technical_score is not None
                else 0
            ),

            "communication_score": (
                answer.communication_score
                if answer and answer.communication_score is not None
                else 0
            ),

            "confidence_score": (
                answer.confidence_score
                if answer and answer.confidence_score is not None
                else 0
            ),

            "overall_score": (
                answer.overall_score
                if answer and answer.overall_score is not None
                else 0
            ),

            "feedback": (
                answer.feedback
                if answer
                else None
            ),
        })

    answers = [
        item
        for item in question_results
        if item["answer"] is not None
    ]

    technical_scores = [
        item["technical_score"]
        for item in answers
    ]

    communication_scores = [
        item["communication_score"]
        for item in answers
    ]

    confidence_scores = [
        item["confidence_score"]
        for item in answers
    ]

    overall_scores = [
        item["overall_score"]
        for item in answers
    ]

    return {
        "session_id": session.id,
        "status": session.status,
        "started_at": session.started_at,
        "completed_at": session.completed_at,

        "total_questions": len(questions),

        "answered_questions": len(answers),

        "evaluated_answers": len([
            item
            for item in answers
            if item["overall_score"] is not None
        ]),

        "technical_score": round(
            sum(technical_scores) / len(technical_scores),
            2
        ) if technical_scores else 0,

        "communication_score": round(
            sum(communication_scores) / len(communication_scores),
            2
        ) if communication_scores else 0,

        "confidence_score": round(
            sum(confidence_scores) / len(confidence_scores),
            2
        ) if confidence_scores else 0,

        "overall_score": (
            session.overall_score
            if session.overall_score is not None
            else (
                round(
                    sum(overall_scores) / len(overall_scores),
                    2
                )
                if overall_scores
                else 0
            )
        ),

        "questions": question_results,
    }

def cancel_interview(
    db: Session,
    session_id: int,
    user_id: int,
):
    session = (
        db.query(InterviewSession)
        .filter(
            InterviewSession.id == session_id,
            InterviewSession.user_id == user_id,
        )
        .first()
    )

    if not session:
        return None

    # Delete all answers belonging to this interview
    questions = (
        db.query(InterviewQuestion)
        .filter(
            InterviewQuestion.interview_session_id == session_id
        )
        .all()
    )

    for question in questions:
        db.query(InterviewAnswer).filter(
            InterviewAnswer.interview_question_id == question.id
        ).delete(
            synchronize_session=False
        )

    # Delete all questions
    db.query(InterviewQuestion).filter(
        InterviewQuestion.interview_session_id == session_id
    ).delete(
        synchronize_session=False
    )

    # Delete the interview session itself
    db.delete(session)

    db.commit()

    return {
        "session_id": session_id,
        "status": "CANCELLED",
        "message": "Interview cancelled and partial data deleted."
    }