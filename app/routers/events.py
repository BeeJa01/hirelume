from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Event
from app.schemas import EventIn
router=APIRouter()
@router.post("")
def event(p:EventIn,db:Session=Depends(get_db)):
    e=Event(**p.model_dump());db.add(e);db.commit();return {"saved":True}
