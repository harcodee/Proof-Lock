"""
Trust Scoring Service (AI Microservice version — no SQLAlchemy)
Weights:
  Face confidence: 0.30
  Liveness detection: 0.25
  Document parse: 0.20
  Metadata integrity: 0.15
  Behavioral signal: 0.10
"""
from datetime import datetime


# ─── Standalone Tier Constants ──────────────────────────────────
class TrustTier:
    UNVERIFIED = "UNVERIFIED"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    VERIFIED = "VERIFIED"


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
        tier = TrustTier.VERIFIED
    elif composite >= 0.70:
        tier = TrustTier.HIGH
    elif composite >= 0.50:
        tier = TrustTier.MEDIUM
    elif composite >= 0.25:
        tier = TrustTier.LOW
    else:
        tier = TrustTier.UNVERIFIED

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
        TrustTier.VERIFIED: "Verified",
        TrustTier.HIGH: "High Confidence",
        TrustTier.MEDIUM: "Moderate Confidence",
        TrustTier.LOW: "Low Confidence",
        TrustTier.UNVERIFIED: "Unverified",
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
