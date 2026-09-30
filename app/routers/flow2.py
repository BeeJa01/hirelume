from fastapi import APIRouter, Depends, HTTPException
from app.deps import get_current_user

router = APIRouter()


@router.post("/analyses")
def analyze(u=Depends(get_current_user)):
    raise HTTPException(503, "Flow 2 analysis is not available yet")


@router.get("/analyses/{analysis_id}")
def get_analysis(analysis_id: int, u=Depends(get_current_user)):
    raise HTTPException(404, "Analysis not found")
