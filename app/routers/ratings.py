from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Rating
from app.schemas import RatingIn
router=APIRouter()
@router.post("")
def rate(p:RatingIn,db:Session=Depends(get_db)):
    r=Rating(**p.model_dump());db.add(r);db.commit();db.refresh(r);return {"id":r.id,"saved":True}
