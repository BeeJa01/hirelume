import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import require_role
from app.models import Application, Job, AnalysisResult, StatusAudit
from app.schemas import StatusUpdate

router = APIRouter()


def recruiter_application(application_id, recruiter_id, db):
    return (
        db.query(Application)
        .join(Job, Application.job_id == Job.id)
        .filter(Application.id == application_id, Job.recruiter_id == recruiter_id)
        .first()
    )


@router.get("/{application_id}")
def detail(application_id: int, u=Depends(require_role("recruiter")), db: Session = Depends(get_db)):
    a = recruiter_application(application_id, u.id, db)
    if not a:
        raise HTTPException(404, "APPLICATION_NOT_FOUND")
    r = db.query(AnalysisResult).filter(AnalysisResult.application_id == a.id).order_by(AnalysisResult.id.desc()).first()
    return {
        "id": a.id,
        "name": a.name,
        "email": a.email,
        "phone": a.phone,
        "status": a.status,
        "analysis_status": a.analysis_status,
        "analysis_attempts": a.analysis_attempts,
        "score": a.analysis_score,
        "match_level": a.match_level,
        "reason": a.reason,
        "needs_review": a.needs_review,
        "cv_locked": a.cv_locked,
        "applied_at": a.applied_at,
        "analysis_updated_at": a.analysis_updated_at,
        "analysis": json.loads(r.result_json) if r else None,
    }


@router.get("/{application_id}/cv")
def private_cv(application_id: int, u=Depends(require_role("recruiter")), db: Session = Depends(get_db)):
    a = recruiter_application(application_id, u.id, db)
    if not a:
        raise HTTPException(404, "APPLICATION_NOT_FOUND")
    path = Path(a.cv_path)
    if not path.exists():
        raise HTTPException(404, "CV_NOT_FOUND")
    return FileResponse(path, filename=a.cv_filename, media_type="application/octet-stream")


@router.patch("/{application_id}/status")
def status(application_id: int, p: StatusUpdate, u=Depends(require_role("recruiter")), db: Session = Depends(get_db)):
    a = recruiter_application(application_id, u.id, db)
    if not a:
        raise HTTPException(404, "APPLICATION_NOT_FOUND")
    old_status = a.status
    if old_status != p.status:
        db.add(StatusAudit(application_id=a.id, actor_user_id=u.id, old_status=old_status, new_status=p.status))
        a.status = p.status
        db.commit()
    return {"id": a.id, "status": a.status}


@router.get("/{application_id}/status-history")
def status_history(application_id: int, u=Depends(require_role("recruiter")), db: Session = Depends(get_db)):
    a = recruiter_application(application_id, u.id, db)
    if not a:
        raise HTTPException(404, "APPLICATION_NOT_FOUND")
    rows = db.query(StatusAudit).filter(StatusAudit.application_id == a.id).order_by(StatusAudit.created_at.desc()).all()
    return [{"old_status": r.old_status, "new_status": r.new_status, "actor_user_id": r.actor_user_id, "created_at": r.created_at} for r in rows]
