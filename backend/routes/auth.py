from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
import bcrypt

from database import get_db
from models import User

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except ValueError:
        return False

@router.post("/register")
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    username_lower = req.username.strip().lower()
    existing_user = db.query(User).filter(User.username == username_lower).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(req.password)
    user = User(
        username=username_lower,
        email=req.email.strip().lower(),
        password_hash=hashed_password,
        is_verified=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "User created successfully", "user_id": user.id}

@router.post("/login")
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    username_lower = req.username.strip().lower()
    user = db.query(User).filter(User.username == username_lower).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    return {
        "user_id": user.id,
        "username": user.username,
        "is_verified": user.is_verified
    }
