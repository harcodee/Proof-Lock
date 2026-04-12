"""
Audit Route — paginated audit trail.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from services.audit_service import get_audit_trail

router = APIRouter()


@router.get("/audit/{identity_id}")
def audit_trail(
    identity_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get paginated audit trail for an identity."""
    try:
        result = get_audit_trail(identity_id, db, page, page_size)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch audit trail: {str(e)}")
