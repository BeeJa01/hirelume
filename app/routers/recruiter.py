from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import require_role
from app.models import Job, Application

router = APIRouter()


@router.get("/dashboard")
def dashboard(u=Depends(require_role("recruiter")), db: Session = Depends(get_db)):
    jobs = db.query(Job).filter(Job.recruiter_id == u.id).all()
    ids = [j.id for j in jobs]
    apps = db.query(Application).filter(Application.job_id.in_(ids)).all() if ids else []
    return {
        "jobs": len(jobs),
        "applications": len(apps),
        "shortlisted": sum(a.status == "shortlisted" for a in apps),
        "interviews": 0,
        "recent_applications": [
            {"id": a.id, "name": a.name, "status": a.status, "score": a.analysis_score, "analysis_status": a.analysis_status}
            for a in sorted(apps, key=lambda x: x.applied_at, reverse=True)[:10]
        ],
    }


@router.get("/jobs/{job_id}/applicants")
def applicants(job_id: int, sort: str = Query("score"), u=Depends(require_role("recruiter")), db: Session = Depends(get_db)):
    j = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == u.id).first()
    if not j:
        raise HTTPException(404, "JOB_NOT_FOUND")
    apps = db.query(Application).filter(Application.job_id == job_id).all()
    if sort == "date":
        apps.sort(key=lambda a: a.applied_at, reverse=True)
    else:
        apps.sort(key=lambda a: (a.analysis_score is not None, a.analysis_score or -1), reverse=True)
    return {
        "total": len(apps),
        "applicants": [
            {
                "id": a.id,
                "name": a.name,
                "score": a.analysis_score,
                "level": a.match_level,
                "reason": a.reason,
                "needs_review": a.needs_review,
                "status": a.status,
                "analysis_status": a.analysis_status,
                "applied_at": a.applied_at,
            }
            for a in apps
        ],
    }
