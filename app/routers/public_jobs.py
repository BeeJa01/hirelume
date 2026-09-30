from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Job, Requirement, Application
from app.config import settings
import secrets

router = APIRouter()
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
ALLOWED_EXTENSIONS = {".pdf", ".docx"}


@router.get("/{token}")
def get_public(token: str, db: Session = Depends(get_db)):
    j = db.query(Job).filter(Job.public_token == token).first()
    if not j:
        raise HTTPException(404, "JOB_NOT_FOUND")
    rs = db.query(Requirement).filter(Requirement.job_id == j.id).order_by(Requirement.position).all()
    return {
        "status": j.status,
        "id": j.id,
        "title": j.title,
        "description": j.description,
        "requirements": [{"text": r.text, "type": r.requirement_type} for r in rs],
    }


@router.post("/{token}/applications")
async def apply(
    token: str,
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    consent: bool = Form(...),
    consent_version: str = Form(...),
    cv: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    j = db.query(Job).filter(Job.public_token == token).first()
    if not j:
        raise HTTPException(404, "JOB_NOT_FOUND")
    if j.status == "closed":
        raise HTTPException(409, "JOB_CLOSED")
    if not consent:
        raise HTTPException(400, "CONSENT_REQUIRED")

    normalized_email = email.strip().lower()
    if db.query(Application).filter(Application.job_id == j.id, Application.email == normalized_email).first():
        raise HTTPException(409, "DUPLICATE_APPLICATION")

    suffix = Path(cv.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, "CV_UNSUPPORTED_FORMAT")

    max_bytes = settings.max_file_size_mb * 1024 * 1024
    chunks = []
    size = 0
    while chunk := await cv.read(min(64 * 1024, max_bytes + 1 - size)):
        size += len(chunk)
        if size > max_bytes:
            raise HTTPException(413, "CV_TOO_LARGE")
        chunks.append(chunk)

    content = b"".join(chunks)
    if not content:
        raise HTTPException(400, "CV_EMPTY")

    path = UPLOAD_DIR / f"{uuid4().hex}{suffix}"
    try:
        path.write_bytes(content)
        a = Application(
            job_id=j.id,
            name=name.strip(),
            email=normalized_email,
            phone=phone.strip(),
            cv_filename=cv.filename or "cv" + suffix,
            cv_path=str(path),
            cv_locked=True,
            consent_given=True,
            consent_version=consent_version,
            private_result_token=secrets.token_urlsafe(48),
            analysis_status="pending",
        )
        db.add(a)
        j.requirements_locked = True
        db.commit()
    except Exception:
        db.rollback()
        path.unlink(missing_ok=True)
        raise

    db.refresh(a)
    return {
        "application_id": a.id,
        "analysis_status": a.analysis_status,
        "result_token": a.private_result_token,
        "message": "Application received",
    }
