import json
import re

from sqlalchemy.orm import Session
from google.api_core.exceptions import ResourceExhausted

from app.ai.gemini import model
from app.models.interview_question import InterviewQuestion
from app.models.interview_answer import InterviewAnswer


BATCH_EVALUATION_PROMPT = """
You are a senior technical interviewer evaluating a complete campus-placement mock interview.

Evaluate ALL candidate answers together.

Your evaluation must be fair, consistent, evidence-based, and based ONLY on what the candidate actually said.

===========================================================
STRICT EVALUATION RULES
===========================================================

1. Evaluate only the candidate's actual answer.

2. Do NOT give credit for information that the candidate did not mention.

3. Do NOT invent explanations, technologies, experience, or knowledge
   that are not present in the candidate's answer.

4. Compare the candidate's answer against:
   - The question
   - The category
   - Expected topics
   - Ideal answer

5. Do NOT require the candidate to reproduce the ideal answer word-for-word.

6. Concise answers can receive very high scores if they are correct,
   relevant, and sufficiently complete.

7. Do NOT lower a score merely because the candidate did not provide
   unnecessary details.

8. If the candidate explicitly says:
   - "I don't know"
   - "Sorry, I don't know"
   - "I am not sure"
   - "I'm not familiar with this"
   - or gives an equivalent response,
   treat the answer as NOT KNOWING the answer.

9. A candidate who does not know the answer should receive:
   - very low technical_score
   - low overall_score
   - communication_score based only on how clearly they communicated
     that they did not know
   - confidence_score based only on the text response

10. Do NOT confuse confidence with correctness.

11. confidence_score is ONLY a temporary text-based estimate.
    It will later be replaced/enhanced using audio and video analysis.

12. Do NOT artificially lower excellent answers.
    A genuinely excellent answer should be capable of receiving
    9.0, 9.5, or even 10.0.

13. Do NOT artificially give high scores.
    A weak or incomplete answer must receive an appropriately lower score.

14. Evaluate every question.

15. Return exactly one evaluation for every question.

===========================================================
TECHNICAL SCORE — 0 TO 10
===========================================================

10:
Exceptional answer.
Completely correct, directly relevant, sufficiently complete,
covers the important expected concepts, and contains no meaningful
technical errors.

9 - 9.9:
Excellent answer.
Correct, relevant, well explained, and covers almost all important
concepts. Only very minor omissions or lack of an additional example.

8 - 8.9:
Strong answer.
Correct and relevant with good understanding, but has one or more
minor omissions, simplifications, or limited depth.

7 - 7.9:
Good answer.
Mostly correct and demonstrates understanding, but misses some
important details or contains minor inaccuracies.

6 - 6.9:
Acceptable answer.
Shows reasonable understanding but is incomplete, shallow,
or contains noticeable inaccuracies.

4 - 5.9:
Partial understanding.
Some correct concepts are present, but important parts are missing
or incorrect.

2 - 3.9:
Weak answer.
Very limited understanding, significant technical errors,
or mostly irrelevant content.

1 - 1.9:
Very poor technical understanding.

0:
No meaningful technical answer, or the candidate explicitly states
that they do not know the answer.

===========================================================
COMMUNICATION SCORE — 0 TO 10
===========================================================

10:
Extremely clear, structured, concise, natural, and easy to follow.

9 - 9.9:
Very clear and well structured with only tiny communication issues.

8 - 8.9:
Clear and understandable with minor issues.

7 - 7.9:
Generally clear but somewhat unstructured or repetitive.

6 - 6.9:
Understandable but noticeably disorganized or unclear in places.

4 - 5.9:
Difficult to follow or poorly structured.

2 - 3.9:
Very unclear communication.

0 - 1.9:
Almost impossible to understand.

IMPORTANT:
Communication score is independent of technical correctness.

A technically incorrect answer can still be communicated clearly.

===========================================================
CONFIDENCE SCORE — 0 TO 10
===========================================================

This is a temporary estimate based ONLY on the written answer.

10:
Very assertive, direct, structured, and decisive language.

8 - 9.9:
Generally confident and direct.

6 - 7.9:
Reasonably confident but contains some hesitation or uncertainty.

4 - 5.9:
Noticeable uncertainty or hesitation.

2 - 3.9:
Very uncertain.

0 - 1.9:
Extremely uncertain or explicitly unable to answer.

IMPORTANT:
Do NOT infer actual body language or voice confidence from text.

===========================================================
OVERALL SCORE
===========================================================

DO NOT calculate or provide the final overall score yourself.

Return "overall_score": 0 for every evaluation.

The backend will calculate the overall score using:

70% Technical Score
30% Communication Score

The temporary confidence score must NOT affect the overall score yet.

===========================================================
QUESTION TYPE CONSIDERATION
===========================================================

Behavioral questions:
Focus more on relevance, communication, clarity, motivation,
self-awareness, and quality of response.

Project questions:
Focus heavily on technical accuracy, understanding of the project,
candidate contribution, technologies, challenges, and reasoning.

Core Computer Science questions:
Focus heavily on conceptual correctness, important technical concepts,
and clarity of explanation.

===========================================================
OUTPUT FORMAT
===========================================================

Return ONLY valid JSON.

The response MUST start with [
and MUST end with ].

Do NOT return markdown.

Do NOT return an object containing the array.

Return exactly one object for every question.

Required format:

[
  {{
    "question_number": 1,
    "technical_score": 0,
    "communication_score": 0,
    "confidence_score": 0,
    "overall_score": 0,
    "feedback": "Detailed constructive feedback",
    "strengths": ["strength 1"],
    "improvements": ["improvement 1"]
  }}
]

===========================================================
INTERVIEW
===========================================================

{interview}
"""


def _clamp_score(value, minimum=0.0, maximum=10.0):
    """
    Keep AI-generated scores safely between 0 and 10.
    """
    try:
        value = float(value)
    except (TypeError, ValueError):
        return 0.0

    return round(max(minimum, min(maximum, value)), 2)


def _parse_json_response(text: str):
    """
    Safely extract a JSON array from Gemini's response.
    """

    text = text.strip()

    # Remove markdown code fences if Gemini adds them.
    text = re.sub(r"^```json\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^```\s*", "", text)
    text = re.sub(r"\s*```$", "", text)

    text = text.strip()

    # Find the JSON array.
    start = text.find("[")
    end = text.rfind("]")

    if start == -1 or end == -1:
        raise ValueError(
            "Gemini did not return a valid JSON array."
        )

    json_text = text[start:end + 1]

    try:
        return json.loads(json_text)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"Gemini returned invalid JSON: {exc}"
        ) from exc


def evaluate_interview(
    db: Session,
    session_id: int,
):
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
        return None

    interview_parts = []

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
                "status": "incomplete",
                "message": (
                    f"Question {question.question_number} "
                    "has not been answered."
                )
            }

        interview_parts.append(
            f"""
===========================================================
QUESTION {question.question_number}
===========================================================

QUESTION:
{question.question}

CATEGORY:
{question.category}

EXPECTED TOPICS:
{question.expected_topics}

IDEAL ANSWER:
{question.ideal_answer}

CANDIDATE ANSWER:
{answer.answer_text}

ANSWER DURATION:
{answer.answer_duration} seconds
"""
        )

    interview_text = "\n".join(interview_parts)

    prompt = BATCH_EVALUATION_PROMPT.format(
        interview=interview_text
    )

    try:
        # IMPORTANT:
        # This is the ONLY Gemini call used for evaluating
        # the complete interview.
        response = model.generate_content(prompt)

    except ResourceExhausted:
        return {
            "status": "evaluation_unavailable",
            "message": (
                "AI evaluation is temporarily unavailable "
                "because the Gemini API quota has been exceeded."
            )
        }

    if not response or not response.text:
        raise ValueError(
            "Gemini returned an empty evaluation response."
        )

    evaluations = _parse_json_response(
        response.text
    )

    if not isinstance(evaluations, list):
        raise ValueError(
            "Gemini returned an invalid evaluation format."
        )

    if len(evaluations) != len(questions):
        raise ValueError(
            "Gemini did not return an evaluation for every question."
        )

    # Keep track of which questions Gemini evaluated.
    evaluated_question_numbers = set()

    for evaluation in evaluations:

        if not isinstance(evaluation, dict):
            raise ValueError(
                "Gemini returned an invalid evaluation object."
            )

        if "question_number" not in evaluation:
            raise ValueError(
                "Evaluation is missing question_number."
            )

        question_number = int(
            evaluation["question_number"]
        )

        if question_number in evaluated_question_numbers:
            raise ValueError(
                f"Duplicate evaluation for question "
                f"{question_number}."
            )

        evaluated_question_numbers.add(
            question_number
        )

        question = (
            db.query(InterviewQuestion)
            .filter(
                InterviewQuestion.interview_session_id == session_id,
                InterviewQuestion.question_number == question_number
            )
            .first()
        )

        if not question:
            raise ValueError(
                f"Gemini returned an invalid question number: "
                f"{question_number}"
            )

        answer = (
            db.query(InterviewAnswer)
            .filter(
                InterviewAnswer.interview_question_id == question.id
            )
            .first()
        )

        if not answer:
            raise ValueError(
                f"Answer not found for question "
                f"{question_number}."
            )

        # ------------------------------------------------
        # SCORE VALIDATION
        # ------------------------------------------------

        technical_score = _clamp_score(
            evaluation.get("technical_score")
        )

        communication_score = _clamp_score(
            evaluation.get("communication_score")
        )

        confidence_score = _clamp_score(
            evaluation.get("confidence_score")
        )

        # ------------------------------------------------
        # BACKEND CALCULATES OVERALL SCORE
        # ------------------------------------------------
        #
        # Technical = 70%
        # Communication = 30%
        #
        # Confidence is intentionally NOT included yet.
        #

        overall_score = round(
            (technical_score * 0.70)
            + (communication_score * 0.30),
            2
        )

        answer.technical_score = technical_score
        answer.communication_score = communication_score
        answer.confidence_score = confidence_score
        answer.overall_score = overall_score

        answer.feedback = json.dumps({
            "feedback": evaluation.get(
                "feedback",
                ""
            ),
            "strengths": evaluation.get(
                "strengths",
                []
            ),
            "improvements": evaluation.get(
                "improvements",
                []
            ),
        })

    # Make absolutely sure every question was evaluated.
    expected_question_numbers = {
        question.question_number
        for question in questions
    }

    if evaluated_question_numbers != expected_question_numbers:
        raise ValueError(
            "Gemini did not evaluate exactly all interview questions."
        )

    db.commit()

    return {
        "status": "evaluated",
        "evaluated_answers": len(evaluations),
    }