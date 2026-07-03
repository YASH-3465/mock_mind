from sqlalchemy.orm import Session

from app.models.resume import Resume


def save_resume(
    db: Session,
    user_id: int,
    file_name: str,
    file_path: str,
):
    resume = Resume(
        user_id=user_id,
        file_name=file_name,
        file_path=file_path,
    )

    db.add(resume)
    db.commit()
    db.refresh(resume)

    return resume