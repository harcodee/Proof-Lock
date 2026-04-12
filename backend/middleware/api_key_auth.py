"""
Middleware — API Key authentication for external verification endpoint.
"""
import hashlib
from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from models import ApiKey


def hash_api_key(key: str) -> str:
    """Hash an API key for secure storage comparison."""
    return hashlib.sha256(key.encode()).hexdigest()


async def verify_api_key(request: Request, db: Session = Depends(get_db)):
    """
    Dependency that validates the X-API-Key header.
    For demo purposes, if no API keys exist in DB, allows a default demo key.
    """
    api_key = request.headers.get("X-API-Key")

    if not api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")

    # Demo mode: accept "demo-key-12345" if no keys in DB
    key_count = db.query(ApiKey).count()
    if key_count == 0 and api_key == "demo-key-12345":
        return {"owner": "demo", "scopes": ["verify", "audit"]}

    # Look up hashed key
    key_hash = hash_api_key(api_key)
    record = db.query(ApiKey).filter(
        ApiKey.key_hash == key_hash,
        ApiKey.is_active == True,
    ).first()

    if not record:
        raise HTTPException(status_code=403, detail="Invalid or inactive API key")

    # Update last_used
    record.last_used = datetime.utcnow()
    db.commit()

    return {
        "owner": record.owner,
        "scopes": record.scopes or [],
    }


def require_scope(scope: str):
    """Returns a dependency that checks if the API key has the required scope."""
    async def check_scope(key_info: dict = Depends(verify_api_key)):
        if scope not in key_info.get("scopes", []):
            raise HTTPException(
                status_code=403,
                detail=f"API key does not have required scope: {scope}",
            )
        return key_info
    return check_scope
