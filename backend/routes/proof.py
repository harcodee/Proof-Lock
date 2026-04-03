from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from services.zkp_service import generate_proof

router = APIRouter()


class ProofRequest(BaseModel):
    user_id: int
    condition: str


@router.post("/generate-proof")
def create_proof(request: ProofRequest, db: Session = Depends(get_db)):
    try:
        result = generate_proof(request.user_id, request.condition, db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Proof generation failed: {str(e)}")
