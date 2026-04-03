from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from services.identity_service import register_identity

router = APIRouter()


@router.post("/register")
async def register(
    name: str = Form(...),
    age: int = Form(...),
    id_number: str = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    try:
        result = await register_identity(name, age, id_number, image, db)
        return {
            "user_id": result["user_id"],
            "name": result["name"],
            "fraud_score": result["fraud_score"],
            "message": "Identity registered and verified",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")
