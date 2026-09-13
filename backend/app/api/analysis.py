from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.jwt import verify_token
from app.db.database import get_db
from app.models.resume import Resume
from app.models.user import User
from app.schemas.resume_analysis import ResumeAnalysisResponse
from app.services.analysis_service import analyze_resume

router = APIRouter(prefix="/analysis", tags=["Resume Analysis"])
security = HTTPBearer()


@router.post("/{resume_id}", response_model=ResumeAnalysisResponse)
def analyze(
    resume_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    email = verify_token(credentials.credentials)
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    return analyze_resume(db, resume_id)
