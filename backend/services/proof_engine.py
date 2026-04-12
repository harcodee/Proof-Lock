"""
Proof Engine — claim packaging, selective disclosure, proof token sign/verify.
Implements a claim-based proof model with selective disclosure.

Claims: age_over_18, country_match, face_verified, doc_valid, trust_tier
Each claim: { type, value, verified_at, expiry, disclosure: FULL|PARTIAL|HIDDEN }
"""
import json
import hashlib
import hmac
import uuid
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session

from models import User, Proof, TrustResult, Credential


HMAC_SECRET = b"ivp-proof-engine-secret-v2"  # In production, use env variable
DEFAULT_TTL_MINUTES = 15


# ─── Claim Generation ──────────────────────────────────────────
def generate_claims(user: User, trust_result: Optional[TrustResult] = None) -> dict:
    """
    Generates all available claims for a user.
    """
    now = datetime.utcnow()
    expiry = (now + timedelta(hours=24)).isoformat()

    claims = {
        "age_over_18": {
            "type": "age_over_18",
            "value": user.age >= 18,
            "verified_at": now.isoformat(),
            "expiry": expiry,
            "disclosure": "FULL",
        },
        "age_over_21": {
            "type": "age_over_21",
            "value": user.age >= 21,
            "verified_at": now.isoformat(),
            "expiry": expiry,
            "disclosure": "FULL",
        },
        "face_verified": {
            "type": "face_verified",
            "value": user.fraud_score == "LOW",
            "verified_at": now.isoformat(),
            "expiry": expiry,
            "disclosure": "FULL",
        },
        "doc_valid": {
            "type": "doc_valid",
            "value": user.doc_verified or False,
            "verified_at": now.isoformat(),
            "expiry": expiry,
            "disclosure": "FULL",
        },
        "identity_verified": {
            "type": "identity_verified",
            "value": user.fraud_score in ("LOW", "MEDIUM"),
            "verified_at": now.isoformat(),
            "expiry": expiry,
            "disclosure": "FULL",
        },
    }

    if trust_result:
        claims["trust_tier"] = {
            "type": "trust_tier",
            "value": trust_result.tier,
            "verified_at": now.isoformat(),
            "expiry": expiry,
            "disclosure": "FULL",
        }

    return claims


# ─── Selective Disclosure ───────────────────────────────────────
def apply_selective_disclosure(
    claims: dict,
    disclosed_fields: list[str],
) -> dict:
    """
    Strips non-disclosed claims. Returns only disclosed claims with values.
    Hidden claims return type + verified_at only (no value).
    """
    result = {}
    for key, claim in claims.items():
        if key in disclosed_fields:
            result[key] = claim.copy()
            result[key]["disclosure"] = "FULL"
        else:
            result[key] = {
                "type": claim["type"],
                "value": "[HIDDEN]",
                "verified_at": claim["verified_at"],
                "disclosure": "HIDDEN",
            }
    return result


# ─── Proof Token ────────────────────────────────────────────────
def sign_proof_token(disclosed_claims: dict, did: str) -> str:
    """
    HMAC-signs a JSON of disclosed claims only.
    Returns: hex-encoded HMAC-SHA256 signature.
    """
    payload = json.dumps(
        {"claims": disclosed_claims, "did": did, "signed_at": datetime.utcnow().isoformat()},
        sort_keys=True,
    )
    return hmac.new(HMAC_SECRET, payload.encode(), hashlib.sha256).hexdigest()


def verify_proof_token(proof_id: str, db: Session) -> dict:
    """
    Verifies a proof by ID. Returns disclosed claims + boolean result + DID.
    Never returns raw personal data.
    """
    proof = db.query(Proof).filter(Proof.proof_id == proof_id).first()
    if not proof:
        return {"valid": False, "error": "Proof not found"}

    # Check expiry
    if proof.expires_at and proof.expires_at < datetime.utcnow():
        return {"valid": False, "error": "Proof expired"}

    # Check max uses
    if proof.max_uses and proof.used_count >= proof.max_uses:
        return {"valid": False, "error": "Proof max uses exceeded"}

    # Increment used count
    proof.used_count += 1
    db.commit()

    # Get user's credential for DID
    credential = (
        db.query(Credential)
        .filter(Credential.user_id == proof.user_id)
        .order_by(Credential.id.desc())
        .first()
    )

    return {
        "valid": True,
        "proof_id": proof.proof_id,
        "result": proof.result,
        "claims": proof.claims,
        "disclosed_fields": proof.disclosed_fields,
        "did": credential.did if credential else None,
        "used_count": proof.used_count,
        "reusable": proof.reusable,
    }


# ─── Full Proof Generation ─────────────────────────────────────
def generate_selective_proof(
    user_id: int,
    disclosed_fields: list[str],
    reusable: bool = False,
    max_uses: Optional[int] = None,
    ttl_minutes: int = DEFAULT_TTL_MINUTES,
    db: Session = None,
) -> dict:
    """
    Creates a selective-disclosure proof with HMAC-signed token.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User with id {user_id} not found")

    # Get latest trust result
    trust_result = (
        db.query(TrustResult)
        .filter(TrustResult.user_id == user_id)
        .order_by(TrustResult.id.desc())
        .first()
    )

    # Get credential for DID
    credential = (
        db.query(Credential)
        .filter(Credential.user_id == user_id)
        .order_by(Credential.id.desc())
        .first()
    )
    did = credential.did if credential else f"did:ivp:temp:{user_id}"

    # Generate all claims
    all_claims = generate_claims(user, trust_result)

    # Apply selective disclosure
    disclosed = apply_selective_disclosure(all_claims, disclosed_fields)

    # Extract only disclosed with FULL access for signing
    full_disclosed = {k: v for k, v in disclosed.items() if v["disclosure"] == "FULL"}

    # Sign proof token
    proof_token = sign_proof_token(full_disclosed, did)

    # Overall result: at least one disclosed claim is True
    result = any(
        v.get("value") is True
        for v in full_disclosed.values()
        if isinstance(v.get("value"), bool)
    )

    now = datetime.utcnow()
    proof_id = str(uuid.uuid4())

    # Create proof record
    proof = Proof(
        user_id=user_id,
        condition=f"selective_disclosure:{','.join(disclosed_fields)}",
        result=result,
        proof_id=proof_id,
        created_at=now,
        claims=disclosed,
        disclosed_fields=disclosed_fields,
        reusable=reusable,
        used_count=0,
        max_uses=max_uses,
        expires_at=now + timedelta(minutes=ttl_minutes),
    )
    db.add(proof)
    db.commit()
    db.refresh(proof)

    return {
        "proof_id": proof_id,
        "did": did,
        "result": result,
        "disclosed_claims": disclosed,
        "all_claims": {k: {**v, "value": "[HIDDEN]" if k not in disclosed_fields else v["value"]}
                       for k, v in all_claims.items()},
        "proof_token": proof_token,
        "reusable": reusable,
        "max_uses": max_uses,
        "ttl_minutes": ttl_minutes,
        "expires_at": proof.expires_at.isoformat(),
        "data_revealed": False,
    }
