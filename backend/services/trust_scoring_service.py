"""
Trust Scoring Service — multi-signal aggregator → structured TrustResult.
Weights:
  Face confidence: 0.30
  Liveness detection: 0.25
  Document parse: 0.20
  Metadata integrity: 0.15
  Behavioral signal: 0.10
"""
from datetime import datetime
from sqlalchemy.orm import Session

from models import TrustResult, TrustTier


WEIGHTS = {
    "face": 0.30,
    "liveness": 0.25,
    "doc": 0.20,
    "meta": 0.15,
    "behavior": 0.10,
}

MODEL_VERSION = "v2.0"


def compute_trust_score(signals: dict) -> dict:
    """
    Aggregates individual signal scores into a composite score and tier.
    signals format: { face: {score}, liveness: {score}, doc: {score}, meta: {score}, behavior: {score} }

    Returns:
    {
        composite_score: float (0–1),
        tier: str,
        signals: dict,
        flags: list[str],
        model_version: str,
    }
    """
    # Weighted sum
    composite = 0.0
    for key, weight in WEIGHTS.items():
        signal = signals.get(key, {})
        score = signal.get("score", 0.0)
        composite += score * weight

    composite = float(round(max(0.0, min(1.0, composite)), 4))

    # Determine tier
    if composite >= 0.85:
        tier = TrustTier.VERIFIED.value
    elif composite >= 0.70:
        tier = TrustTier.HIGH.value
    elif composite >= 0.50:
        tier = TrustTier.MEDIUM.value
    elif composite >= 0.25:
        tier = TrustTier.LOW.value
    else:
        tier = TrustTier.UNVERIFIED.value

    # Collect flags from all signals
    flags = []
    if not signals.get("face", {}).get("detected", False):
        flags.append("face_not_detected")
    if not signals.get("liveness", {}).get("passed", False):
        flags.append("liveness_failed")
    for f in signals.get("meta", {}).get("flags", []):
        flags.append(f)
    for f in signals.get("behavior", {}).get("flags", []):
        flags.append(f)

    # Human-readable label
    human_labels = {
        TrustTier.VERIFIED.value: "Verified",
        TrustTier.HIGH.value: "High Confidence",
        TrustTier.MEDIUM.value: "Moderate Confidence",
        TrustTier.LOW.value: "Low Confidence",
        TrustTier.UNVERIFIED.value: "Unverified",
    }

    return {
        "composite_score": composite,
        "composite_pct": f"{int(composite * 100)}%",
        "tier": tier,
        "tier_label": f"{human_labels.get(tier, tier)} — {int(composite * 100)}%",
        "signals": signals,
        "flags": flags,
        "model_version": MODEL_VERSION,
    }


def save_trust_result(user_id: int, trust_data: dict, db: Session) -> TrustResult:
    """
    Persists a TrustResult to the database.
    """
    result = TrustResult(
        user_id=user_id,
        composite_score=trust_data["composite_score"],
        tier=trust_data["tier"],
        signals=trust_data["signals"],
        flags=trust_data["flags"],
        model_version=trust_data["model_version"],
        reviewed_at=datetime.utcnow(),
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


def get_trust_report(user_id: int, db: Session) -> dict:
    """
    Retrieves the latest trust result for a user with full signal breakdown.
    """
    result = (
        db.query(TrustResult)
        .filter(TrustResult.user_id == user_id)
        .order_by(TrustResult.id.desc())
        .first()
    )
    if not result:
        return None

    human_labels = {
        TrustTier.VERIFIED.value: "Verified",
        TrustTier.HIGH.value: "High Confidence",
        TrustTier.MEDIUM.value: "Moderate Confidence",
        TrustTier.LOW.value: "Low Confidence",
        TrustTier.UNVERIFIED.value: "Unverified",
    }

    return {
        "user_id": result.user_id,
        "composite_score": result.composite_score,
        "composite_pct": f"{int(result.composite_score * 100)}%",
        "tier": result.tier,
        "tier_label": f"{human_labels.get(result.tier, result.tier)} — {int(result.composite_score * 100)}%",
        "signals": result.signals,
        "flags": result.flags,
        "model_version": result.model_version,
        "reviewed_at": result.reviewed_at.isoformat() if result.reviewed_at else None,
    }
