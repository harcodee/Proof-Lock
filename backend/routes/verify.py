from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
import shutil
import uuid

from database import get_db
from models import User
from services.verification_service import verify_proof
from services.trust_scoring_service import get_trust_report

router = APIRouter()


class VerifyRequest(BaseModel):
    proof_id: str


@router.post("/verify-proof")
def verify(request: VerifyRequest, db: Session = Depends(get_db)):
    try:
        from services.proof_engine import verify_proof_token
        # In v2, verify-proof is used by the demo UI, verifying via verify_proof_token
        result = verify_proof_token(request.proof_id, db)
        if not result.get("valid"):
            raise HTTPException(status_code=404, detail=result.get("error", "Invalid proof"))
        
        # Format similar to v1 for backwards compatibility with existing UI temporarily
        # if the UI still expects the old format before v2 UI is fully built
        return {
            "status": "ACCESS_GRANTED" if result["result"] else "ACCESS_DENIED",
            "message": "Access granted" if result["result"] else "Access denied",
            "proof_id": result["proof_id"],
            "statement": "Selective Disclosure",
            "data_revealed": False,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


@router.get("/user/{user_id}")
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    trust = get_trust_report(user_id, db)
    
    return {
        "user_id": user.id,
        "name": user.name,
        "id_number_masked": user.id_number[:4] + "*****" if len(user.id_number) > 4 else "****",
        "fraud_score": user.fraud_score,
        "trust_tier": trust["tier"] if trust else "UNVERIFIED",
        "created_at": user.created_at.isoformat(),
    }

@router.post("/verification/video")
async def receive_video(
    user_id: str = Form(...),
    video_file: UploadFile = File(...)
):
    os.makedirs("uploads/videos", exist_ok=True)
    file_path = f"uploads/videos/{uuid.uuid4()}_video.webm"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(video_file.file, buffer)
        
    return {"status": "received"}
