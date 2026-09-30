import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Application, AnalysisResult, Job

router = APIRouter()


@router.get("/{private_token}")
def result(private_token: str, db: Session = Depends(get_db)):
    a = db.query(Application).filter(Application.private_result_token == private_token).first()
    if not a:
        raise HTTPException(404, "INVALID_RESULT_TOKEN")

    payload = {
        "application_id": a.id,
        "analysis_status": a.analysis_status,
        "feedback_enabled": db.query(Job).filter(Job.id == a.job_id).first().feedback_enabled,
    }
    if a.analysis_status != "completed":
        payload["message"] = "Analysis pending" if a.analysis_status in {"pending", "processing", "queued"} else "Analysis unavailable"
        return payload

    r = db.query(AnalysisResult).filter(AnalysisResult.application_id == a.id).order_by(AnalysisResult.id.desc()).first()
    if not r:
        payload["analysis_status"] = "failed"
        payload["message"] = "Analysis result unavailable"
        return payload

    data = json.loads(r.result_json)
    payload.update({"score": r.score, "match_level": r.match_level, "reason": r.reason, "analysis": data})
    return payload
