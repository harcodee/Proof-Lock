"""
Proofs Route — selective disclosure proof generation.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from services.proof_engine import generate_selective_proof
from services.audit_service import log_event

router = APIRouter()


class SelectiveProofRequest(BaseModel):
    user_id: int
    disclosed_fields: list[str]   # e.g. ["age_over_18", "face_verified"]
    reusable: bool = False
    max_uses: Optional[int] = None
    ttl_minutes: int = 15


@router.post("/proofs/generate")
def create_selective_proof(
    request: SelectiveProofRequest,
    db: Session = Depends(get_db),
):
    """Generate a selective-disclosure proof."""
    try:
        result = generate_selective_proof(
            user_id=request.user_id,
            disclosed_fields=request.disclosed_fields,
            reusable=request.reusable,
            max_uses=request.max_uses,
            ttl_minutes=request.ttl_minutes,
            db=db,
        )

        # Log audit event
        log_event(
            actor=str(request.user_id),
            action="proof_generated",
            target_id=result["proof_id"],
            detail=f"Disclosed: {', '.join(request.disclosed_fields)}",
            db=db,
        )

        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Proof generation failed: {str(e)}")
