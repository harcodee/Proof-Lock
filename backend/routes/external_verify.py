"""
External Verify Route — public verify by DID + proof token.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from middleware.api_key_auth import verify_api_key
from services.proof_engine import verify_proof_token
from services.audit_service import log_event
from models import Credential

router = APIRouter()


class ExternalVerifyRequest(BaseModel):
    did: str
    proof_token: str


@router.post("/verify/external")
def external_verify(
    request: ExternalVerifyRequest,
    db: Session = Depends(get_db),
    key_info: dict = Depends(verify_api_key),
):
    """
    Public-facing verification endpoint.
    Requires API key authentication.
    Verifies a proof by DID + proof_token without exposing raw data.
    """
    try:
        # Find credential by DID
        credential = db.query(Credential).filter(Credential.did == request.did).first()
        if not credential:
            raise HTTPException(status_code=404, detail="DID not found")

        if credential.status != "ACTIVE":
            return {
                "verified": False,
                "did": request.did,
                "status": credential.status,
                "message": f"Credential is {credential.status}",
            }

        # Verify proof token matches
        if credential.proof_token != request.proof_token:
            raise HTTPException(status_code=403, detail="Invalid proof token")

        # Log audit event
        log_event(
            actor=f"api:{key_info.get('owner', 'unknown')}",
            action="external_verify",
            target_id=request.did,
            detail=f"Verified by API key owner: {key_info.get('owner')}",
            db=db,
        )

        return {
            "verified": True,
            "did": request.did,
            "status": credential.status,
            "message": "Identity verified successfully",
            "data_revealed": False,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")
