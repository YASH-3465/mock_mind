import os
import shutil

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.models.resume import Resume
from app.core.jwt import verify_token
from app.db.database import get_db
from app.models.user import User
from app.schemas.resume import ResumeResponse
from app.services.resume_service import save_resume
from app.services.resume_service import get_resume_text

router = APIRouter(
    prefix="/resume",
    tags=["Resume"]
)

security = HTTPBearer()

UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)


# --------------------------------------------------
# GET CURRENT USER'S PREVIOUS RESUMES
# --------------------------------------------------

@router.get("/")
def get_my_resumes(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    email = verify_token(credentials.credentials)

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    resumes = (
        db.query(Resume)
        .filter(
            Resume.user_id == user.id
        )
        .order_by(
            Resume.uploaded_at.desc()
        )
        .all()
    )

    # ----------------------------------------------
    # REMOVE DUPLICATES
    #
    # Existing duplicate database records may already
    # exist, so deduplicate by resume content first.
    # ----------------------------------------------

    unique_resumes = []
    seen_text = set()

    for resume in resumes:

        content_key = (
            resume.resume_text.strip()
            if resume.resume_text
            else resume.file_name.strip().lower()
        )

        if content_key in seen_text:
            continue

        seen_text.add(content_key)

        unique_resumes.append({
            "id": resume.id,
            "file_name": resume.file_name,
            "uploaded_at": resume.uploaded_at,
            "has_analysis": resume.analysis is not None,
        })

    return unique_resumes


# --------------------------------------------------
# UPLOAD NEW RESUME
# --------------------------------------------------

@router.post(
    "/upload",
    response_model=ResumeResponse
)
def upload_resume(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    email = verify_token(credentials.credentials)

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="File name is required"
        )

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    # ----------------------------------------------
    # TEMPORARY FILE
    # ----------------------------------------------

    file_path = os.path.join(
        UPLOAD_DIR,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )

    # ----------------------------------------------
    # EXTRACT TEXT
    # ----------------------------------------------

    resume_text = get_resume_text(file_path)

    normalized_text = (
        resume_text.strip()
        if resume_text
        else ""
    )

    # ----------------------------------------------
    # CHECK DUPLICATE RESUME
    #
    # Same user + same resume content
    # = existing resume
    # ----------------------------------------------

    existing_resumes = (
        db.query(Resume)
        .filter(
            Resume.user_id == user.id
        )
        .all()
    )

    for existing_resume in existing_resumes:

        existing_text = (
            existing_resume.resume_text.strip()
            if existing_resume.resume_text
            else ""
        )

        if (
            normalized_text
            and existing_text
            and normalized_text == existing_text
        ):
            # Remove newly uploaded duplicate file.
            try:
                os.remove(file_path)
            except OSError:
                pass

            return existing_resume

    # ----------------------------------------------
    # SAVE genuinely new resume
    # ----------------------------------------------

    return save_resume(
        db,
        user.id,
        file.filename,
        file_path,
    )


@router.get("/")
def get_my_resumes(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    email = verify_token(credentials.credentials)

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == user.id)
        .order_by(Resume.uploaded_at.desc())
        .all()
    )

    return resumes
# --------------------------------------------------
# READ RESUME TEXT
# --------------------------------------------------

@router.get("/text/{resume_id}")
def read_resume_text(
    resume_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    email = verify_token(
        credentials.credentials
    )

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == user.id,
        )
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    return {
        "text": resume.resume_text
    }