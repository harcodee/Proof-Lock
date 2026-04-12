from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from services.credential_issuer import issue_credential, get_credential_by_user
from services.audit_service import log_event

router = APIRouter()


class GenerateCredentialRequest(BaseModel):
    user_id: int


@router.post("/generate-credential")
def create_credential(request: GenerateCredentialRequest, db: Session = Depends(get_db)):
    try:
        result = issue_credential(request.user_id, db)
        
        # Log event
        log_event(
            actor=str(request.user_id),
            action="credential_issued",
            target_id=str(result.get("credential_id")),
            detail=f"Issued DID: {result.get('did')}",
            db=db,
        )
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Credential generation failed: {str(e)}")


@router.get("/credential/{user_id}")
def fetch_credential(user_id: int, db: Session = Depends(get_db)):
    try:
        result = get_credential_by_user(user_id, db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch credential: {str(e)}")
