"""
Trust Route — full trust signal breakdown.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from services.trust_scoring_service import get_trust_report

router = APIRouter()


@router.get("/trust/{identity_id}/report")
def trust_report(identity_id: int, db: Session = Depends(get_db)):
    """Get full trust signal breakdown for an identity."""
    try:
        result = get_trust_report(identity_id, db)
        if not result:
            raise HTTPException(status_code=404, detail="No trust result found for this identity")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch trust report: {str(e)}")
