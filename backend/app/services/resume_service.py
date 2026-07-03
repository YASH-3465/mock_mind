from sqlalchemy.orm import Session
from app.models.resume import Resume
from app.utils.resume_parser import extract_text_from_pdf


def save_resume(
    db: Session,
    user_id: int,
    file_name: str,
    file_path: str,
):
    resume_text = extract_text_from_pdf(file_path)
    resume = Resume(
        user_id=user_id,
        file_name=file_name,
        file_path=file_path,
        resume_text=resume_text
    )
    
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return resume

def get_resume_text(file_path: str):
    return extract_text_from_pdf(file_path)