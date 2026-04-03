from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from services.credential_service import generate_credential, get_credential

router = APIRouter()


class GenerateCredentialRequest(BaseModel):
    user_id: int


@router.post("/generate-credential")
def issue_credential(request: GenerateCredentialRequest, db: Session = Depends(get_db)):
    try:
        result = generate_credential(request.user_id, db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Credential generation failed: {str(e)}")


@router.get("/credential/{user_id}")
def fetch_credential(user_id: int, db: Session = Depends(get_db)):
    try:
        result = get_credential(user_id, db)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch credential: {str(e)}")
