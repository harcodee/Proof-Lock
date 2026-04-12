"""
Identity Service v2 — Registration with intake pipeline, AI verification, and trust scoring.
"""
import os
import uuid
from fastapi import UploadFile
from sqlalchemy.orm import Session

from models import User
from services.intake_service import validate_and_ingest
from services.ai_verification_service import analyze_all_signals
from services.trust_scoring_service import compute_trust_score, save_trust_result
from services.audit_service import log_event


UPLOAD_DIR = "uploads"


async def register_identity(
    user_id: int,
    name: str,
    age: int,
    id_number: str,
    image: UploadFile = None,
    video: UploadFile = None,
    db: Session = None,
):
    """
    Full v2 registration pipeline:
    1. Validate inputs
    2. Intake image (validate, extract metadata, dedup)
    3. Run AI verification (face + liveness + doc + meta + behavioral)
    4. Compute trust score
    5. Create user record
    6. Log audit event
    Returns: full registration result with trust data
    """
    # Validate inputs
    if not name or not name.strip():
        raise ValueError("Name cannot be empty")
    if age <= 0 or age > 120:
        raise ValueError("Age must be between 1 and 120")
    if not id_number or not id_number.strip():
        raise ValueError("ID number cannot be empty")

    # Step 1: Intake
    intake = await validate_and_ingest(image, video, db) if (image or video) else {
        "image_path": None, "video_path": None, "intake_hash": None, "metadata": {}
    }

    # Step 2: AI Verification
    signals = analyze_all_signals(intake.get("image_path"), intake.get("video_path"), intake.get("metadata", {}))

    # Step 3: Trust Scoring
    trust_data = compute_trust_score(signals)

    # Map trust tier to legacy fraud_score for backward compat
    tier_to_fraud = {
        "VERIFIED": "LOW",
        "HIGH": "LOW",
        "MEDIUM": "MEDIUM",
        "LOW": "HIGH",
        "UNVERIFIED": "HIGH",
    }
    fraud_score = tier_to_fraud.get(trust_data["tier"], "MEDIUM")

    # Step 4: Update user record
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
        
    user.name = name.strip()
    user.age = age
    user.id_number = id_number.strip()
    user.image_path = intake.get("image_path")
    user.fraud_score = fraud_score
    user.liveness_score = signals.get("liveness", {}).get("score", 0.0)
    user.doc_verified = signals.get("doc", {}).get("confidence", 0.0) > 0.5
    user.intake_hash = intake.get("intake_hash")
    user.version = 2
    user.is_verified = True

    db.commit()
    db.refresh(user)

    # Step 5: Save trust result
    trust_result = save_trust_result(user.id, trust_data, db)

    # Step 6: Audit log
    log_event(
        actor=str(user.id),
        action="identity_registered",
        target_id=str(user.id),
        detail=f"Trust tier: {trust_data['tier']}, Score: {trust_data['composite_score']}",
        db=db,
    )

    return {
        "user_id": user.id,
        "name": user.name,
        "age": user.age,
        "fraud_score": user.fraud_score,
        "trust": {
            "composite_score": trust_data["composite_score"],
            "composite_pct": trust_data["composite_pct"],
            "tier": trust_data["tier"],
            "tier_label": trust_data["tier_label"],
            "signals": trust_data["signals"],
            "flags": trust_data["flags"],
            "model_version": trust_data["model_version"],
        },
        "intake": {
            "hash": intake["intake_hash"],
            "metadata": intake.get("metadata", {}),
        },
    }
