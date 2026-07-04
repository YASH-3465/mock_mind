from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.resume_analysis import ResumeAnalysisResponse
from app.services.analysis_service import analyze_resume

router = APIRouter(
    prefix="/analysis",
    tags=["Resume Analysis"]
)


@router.post(
    "/{resume_id}",
    response_model=ResumeAnalysisResponse
)
def analyze(
    resume_id: int,
    db: Session = Depends(get_db)
):
    return analyze_resume(
        db,
        resume_id
    )