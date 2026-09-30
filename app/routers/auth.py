from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import RegisterRequest, LoginRequest
from app.services.auth import hash_password, verify_password, create_access_token
from app.deps import get_current_user

router = APIRouter()


@router.post("/register")
def register(p: RegisterRequest, db: Session = Depends(get_db)):
    email = p.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "Account already exists")

    user = User(
        name=p.name.strip(),
        email=email,
        password_hash=hash_password(p.password),
        role=p.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _auth_response(user)


@router.post("/login")
def login(p: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == p.email.lower()).first()
    if not user or not verify_password(p.password, user.password_hash):
        raise HTTPException(401, "Unable to sign in with those details")
    return _auth_response(user)


@router.get("/me")
def me(user=Depends(get_current_user)):
    return _user_response(user)


def _user_response(user):
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}


def _auth_response(user):
    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
        "user": _user_response(user),
    }
