from app.core.dependencies import get_current_user
from app.models.user import User
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from pathlib import Path

from app.db.database import get_db
from app.services.interview_service import generate_interview_questions
from app.services.interview_service import complete_interview
from app.services.interview_service import get_interview_progress
from app.services.interview_service import get_interview_history
from app.services.interview_service import get_interview_result
from app.services.interview_service import cancel_interview

router = APIRouter(
    prefix="/interview",
    tags=["Interview"]
)


@router.post("/{analysis_id}")
def generate_questions(
    analysis_id: int,
    db: Session = Depends(get_db)
):
    return generate_interview_questions(
        db,
        analysis_id
    )



@router.post("/{session_id}/complete")
def finish_interview(
    session_id: int,
    db: Session = Depends(get_db),
):
    result = complete_interview(
        db=db,
        session_id=session_id,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found."
        )

    if "error" in result:
        raise HTTPException(
            status_code=400,
            detail=result["error"]
        )

    return result



@router.delete("/{session_id}/cancel")
def cancel_interview_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = cancel_interview(
        db=db,
        session_id=session_id,
        user_id=current_user.id,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found."
        )

    return result


@router.get("/history")
def interview_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_interview_history(
        db=db,
        user_id=current_user.id,
    )



@router.get("/{session_id}/result")
def interview_result(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = get_interview_result(
        db=db,
        session_id=session_id,
        user_id=current_user.id,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Interview result not found."
        )

    return result



@router.get("/{session_id}/progress")
def interview_progress(
    session_id: int,
    db: Session = Depends(get_db),
):
    result = get_interview_progress(
        db=db,
        session_id=session_id,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found."
        )

    return result


@router.post("/{session_id}/answer/{question_number}/recording")
async def upload_answer_recording(
    session_id: int,
    question_number: int,
    recording: UploadFile = File(...),
):
    recordings_dir = Path("recordings") / f"session_{session_id}"
    recordings_dir.mkdir(parents=True, exist_ok=True)

    file_path = recordings_dir / f"question_{question_number}.webm"

    contents = await recording.read()

    with open(file_path, "wb") as file:
        file.write(contents)

    return {
        "session_id": session_id,
        "question_number": question_number,
        "filename": file_path.name,
        "content_type": recording.content_type,
        "file_path": str(file_path),
        "file_size": len(contents),
        "message": "Recording saved successfully.",
    }
