from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import User
from services.verification_service import verify_proof

router = APIRouter()


class VerifyRequest(BaseModel):
    proof_id: str


@router.post("/verify-proof")
def verify(request: VerifyRequest, db: Session = Depends(get_db)):
    try:
        result = verify_proof(request.proof_id, db)
        if result["status"] == "ERROR":
            raise HTTPException(status_code=404, detail=result["message"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


@router.get("/user/{user_id}")
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user_id": user.id,
        "name": user.name,
        "id_number_masked": user.id_number[:4] + "*****" if len(user.id_number) > 4 else "****",
        "fraud_score": user.fraud_score,
        "created_at": user.created_at.isoformat(),
    }
