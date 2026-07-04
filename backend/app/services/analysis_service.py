import json
import re

from sqlalchemy.orm import Session

from app.ai.gemini import model
from app.models.resume import Resume
from app.models.resume_analysis import ResumeAnalysis
from app.prompts.resume_prompt import RESUME_ANALYSIS_PROMPT


def analyze_resume(
    db: Session,
    resume_id: int,
):

    # Get the resume first
    resume = db.query(Resume).filter(
        Resume.id == resume_id
    ).first()

    if not resume:
        return None

    # Check if analysis already exists
    existing_analysis = (
        db.query(ResumeAnalysis)
        .filter(
            ResumeAnalysis.resume_id == resume.id
        )
        .first()
    )

    if existing_analysis:
        return existing_analysis

    # Ask Gemini
    prompt = RESUME_ANALYSIS_PROMPT.format(
        resume=resume.resume_text
    )

    response = model.generate_content(prompt)

    text = response.text.strip()

    # Remove markdown if present
    text = re.sub(r"^```json", "", text)
    text = re.sub(r"```$", "", text)
    text = text.strip()

    # Extract JSON safely
    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1:
        raise Exception("Gemini did not return valid JSON.")

    json_text = text[start:end + 1]

    try:
        data = json.loads(json_text)
    except json.JSONDecodeError:
        raise Exception("Gemini returned invalid JSON.")
    

    required_fields = [
    "summary",
    "skills",
    "projects",
    "experience",
    "education",
    "certifications",
    "strengths",
    "weaknesses",
    ]

    for field in required_fields:
        if field not in data:
            data[field] = [] if field != "summary" else ""

    analysis = ResumeAnalysis(
        resume_id=resume.id,
        summary=json.dumps(data.get("summary")),
        skills=json.dumps(data.get("skills")),
        projects=json.dumps(data.get("projects")),
        experience=json.dumps(data.get("experience")),
        education=json.dumps(data.get("education")),
        certifications=json.dumps(data.get("certifications")),
        strengths=json.dumps(data.get("strengths")),
        weaknesses=json.dumps(data.get("weaknesses")),
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return analysis