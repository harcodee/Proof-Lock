"""
Revocation Route — revoke credentials + status check.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from services.revocation_service import revoke_credential
from services.credential_issuer import get_credential_status

router = APIRouter()


class RevokeRequest(BaseModel):
    reason: str


@router.post("/credentials/{credential_id}/revoke")
def revoke(
    credential_id: int,
    request: RevokeRequest,
    db: Session = Depends(get_db),
):
    """Revoke a credential with a reason."""
    try:
        result = revoke_credential(
            credential_id=credential_id,
            reason=request.reason,
            actor="user",
            db=db,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Revocation failed: {str(e)}")


@router.get("/credentials/{credential_id}/status")
def status_check(credential_id: int, db: Session = Depends(get_db)):
    """Lightweight credential status check."""
    try:
        result = get_credential_status(credential_id, db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
