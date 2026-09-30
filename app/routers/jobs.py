import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import require_role
from app.models import Job, Requirement, Application
from app.schemas import JobCreate, JobUpdate

router = APIRouter()


def serialize_job(db, job):
    requirements = db.query(Requirement).filter(Requirement.job_id == job.id).order_by(Requirement.position).all()
    return {
        "id": job.id,
        "title": job.title,
        "description": job.description,
        "status": job.status,
        "public_token": job.public_token,
        "feedback_enabled": job.feedback_enabled,
        "blind_mode": job.blind_mode,
        "requirements_locked": job.requirements_locked,
        "requirements": [{"id": r.id, "text": r.text, "type": r.requirement_type} for r in requirements],
        "created_at": job.created_at,
        "updated_at": job.updated_at,
    }


@router.post("")
def create(p: JobCreate, u=Depends(require_role("recruiter")), db: Session = Depends(get_db)):
    j = Job(
        recruiter_id=u.id,
        title=p.title,
        description=p.description,
        feedback_enabled=p.feedback_enabled,
        blind_mode=p.blind_mode,
        public_token=secrets.token_urlsafe(24),
    )
    db.add(j)
    db.flush()
    for i, r in enumerate(p.requirements):
        db.add(Requirement(job_id=j.id, text=r.text, requirement_type=r.requirement_type, position=i))
    db.commit()
    db.refresh(j)
    return serialize_job(db, j)


@router.get("")
def list_jobs(u=Depends(require_role("recruiter")), db: Session = Depends(get_db)):
    jobs = db.query(Job).filter(Job.recruiter_id == u.id).order_by(Job.created_at.desc()).all()
    return [
        {
            "id": j.id,
            "title": j.title,
            "status": j.status,
            "public_token": j.public_token,
            "feedback_enabled": j.feedback_enabled,
            "blind_mode": j.blind_mode,
            "applicants": db.query(Application).filter(Application.job_id == j.id).count(),
        }
        for j in jobs
    ]


@router.get("/{job_id}/applications")
def ranked_applicants(job_id: int, sort: str = "score", u=Depends(require_role("recruiter")), db: Session = Depends(get_db)):
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


@router.get("/{job_id}")
def get_job(job_id: int, u=Depends(require_role("recruiter")), db: Session = Depends(get_db)):
    j = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == u.id).first()
    if not j:
        raise HTTPException(404, "Job not found")
    return serialize_job(db, j)


@router.patch("/{job_id}")
def update(job_id: int, p: JobUpdate, u=Depends(require_role("recruiter")), db: Session = Depends(get_db)):
    j = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == u.id).first()
    if not j:
        raise HTTPException(404, "Job not found")

    values = p.model_dump(exclude_none=True)
    requirements = values.pop("requirements", None)
    if requirements is not None and j.requirements_locked:
        raise HTTPException(409, "Job requirements are locked after the first application")

    for k, v in values.items():
        setattr(j, k, v)

    if requirements is not None:
        db.query(Requirement).filter(Requirement.job_id == j.id).delete()
        for i, r in enumerate(requirements):
            db.add(Requirement(job_id=j.id, text=r["text"], requirement_type=r["requirement_type"], position=i))

    db.commit()
    db.refresh(j)
    return serialize_job(db, j)


@router.post("/{job_id}/close")
def close(job_id: int, u=Depends(require_role("recruiter")), db: Session = Depends(get_db)):
    j = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == u.id).first()
    if not j:
        raise HTTPException(404, "Job not found")
    j.status = "closed"
    from app.models import now
    j.closed_at = now()
    db.commit()
    return {"id": j.id, "status": j.status}


@router.post("/{job_id}/reopen")
def reopen(job_id: int, u=Depends(require_role("recruiter")), db: Session = Depends(get_db)):
    j = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == u.id).first()
    if not j:
        raise HTTPException(404, "Job not found")
    j.status = "open"
    j.closed_at = None
    db.commit()
    return {"id": j.id, "status": j.status}
