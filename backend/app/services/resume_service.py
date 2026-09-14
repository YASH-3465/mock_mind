from sqlalchemy.orm import Session

from app.models.resume import Resume
from app.utils.resume_parser import extract_text_from_pdf


def save_resume(
    db: Session,
    user_id: int,
    file_name: str,
    file_path: str,
):
    # Extract text from the uploaded PDF.
    #
    # This does NOT call Gemini.
    # It is only used to detect whether this resume
    # already exists for this user.
    resume_text = extract_text_from_pdf(file_path)

    # --------------------------------------------------
    # CHECK FOR DUPLICATE RESUME
    # --------------------------------------------------

    existing_resumes = (
        db.query(Resume)
        .filter(
            Resume.user_id == user_id,
            Resume.resume_text == resume_text,
        )
        .order_by(
            Resume.uploaded_at.desc()
        )
        .all()
    )

    if existing_resumes:
        # We already have this resume.
        #
        # Do not create another database record.
        # Return the existing resume so the frontend
        # can continue using its existing analysis.
        return existing_resumes[0]

    # --------------------------------------------------
    # CREATE NEW RESUME
    # --------------------------------------------------

    resume = Resume(
        user_id=user_id,
        file_name=file_name,
        file_path=file_path,
        resume_text=resume_text,
    )

    db.add(resume)
    db.commit()
    db.refresh(resume)

    return resume


def get_resume_text(file_path: str):
    return extract_text_from_pdf(file_path)