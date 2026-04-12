"""
Credential Issuer — SHA-256 DID generation, expiry, version, status tracking.
Issues W3C-compatible Verifiable Credentials with DID identifiers.
"""
import json
import hashlib
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from models import User, Credential, CredentialStatus


DEFAULT_EXPIRY_DAYS = 365


def generate_did(user_id: int, credential_data: dict) -> str:
    """
    Generates a Decentralized Identifier (DID) from user + credential data.
    Format: did:ivp:<sha256_prefix>
    """
    seed = f"{user_id}:{json.dumps(credential_data, sort_keys=True)}:{uuid.uuid4()}"
    digest = hashlib.sha256(seed.encode()).hexdigest()
    return f"did:ivp:{digest[:32]}"


def issue_credential(
    user_id: int,
    db: Session,
    expiry_days: int = DEFAULT_EXPIRY_DAYS,
) -> dict:
    """
    Issues a new Verifiable Credential for a given user.
    Returns full credential with DID, signature, status, and expiry.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User with id {user_id} not found")

    now = datetime.utcnow()
    expires_at = now + timedelta(days=expiry_days)

    # Map fraud_score to trust tier for credential
    fraud_to_tier = {"LOW": "HIGH", "MEDIUM": "MEDIUM", "HIGH": "LOW"}

    credential_data = {
        "user_id": user.id,
        "name": user.name,
        "age": user.age,
        "fraud_score": user.fraud_score,
        "trust_tier": fraud_to_tier.get(user.fraud_score, "UNVERIFIED"),
        "verified": True,
        "issued_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
        "issuer": "DigitalIDPlatform/v2",
        "credential_type": "VerifiableIdentityCredential",
        "version": 2,
    }

    # Generate DID
    did = generate_did(user_id, credential_data)
    credential_data["did"] = did

    # Sign credential
    json_str = json.dumps(credential_data, sort_keys=True)
    signature = hashlib.sha256(json_str.encode()).hexdigest()

    # Generate proof token
    proof_payload = {
        "did": did,
        "signature": signature,
        "issued_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
    }
    proof_token = hashlib.sha256(
        json.dumps(proof_payload, sort_keys=True).encode()
    ).hexdigest()

    # Save credential to DB
    credential = Credential(
        user_id=user_id,
        data=json_str,
        signature=signature,
        issued_at=now,
        did=did,
        status=CredentialStatus.ACTIVE.value,
        expires_at=expires_at,
        proof_token=proof_token,
        version=2,
    )
    db.add(credential)
    db.commit()
    db.refresh(credential)

    return {
        "credential": credential_data,
        "credential_id": credential.id,
        "did": did,
        "signature": signature,
        "signature_short": signature[:16] + "...",
        "proof_token": proof_token,
        "status": CredentialStatus.ACTIVE.value,
        "expires_at": expires_at.isoformat(),
        "issued_at": now.isoformat(),
    }


def get_credential_by_user(user_id: int, db: Session) -> dict:
    """
    Retrieves the most recent credential for a user.
    """
    credential = (
        db.query(Credential)
        .filter(Credential.user_id == user_id)
        .order_by(Credential.id.desc())
        .first()
    )
    if not credential:
        raise ValueError(f"No credential found for user {user_id}")

    # Auto-check expiry
    status = credential.status
    if credential.expires_at and credential.expires_at < datetime.utcnow():
        status = CredentialStatus.EXPIRED.value
        credential.status = status
        db.commit()

    return {
        "credential": json.loads(credential.data),
        "credential_id": credential.id,
        "did": credential.did,
        "signature": credential.signature,
        "signature_short": credential.signature[:16] + "...",
        "proof_token": credential.proof_token,
        "status": status,
        "expires_at": credential.expires_at.isoformat() if credential.expires_at else None,
        "issued_at": credential.issued_at.isoformat(),
    }


def get_credential_status(credential_id: int, db: Session) -> dict:
    """
    Lightweight status check for a credential.
    """
    credential = db.query(Credential).filter(Credential.id == credential_id).first()
    if not credential:
        raise ValueError(f"Credential {credential_id} not found")

    # Auto-check expiry
    status = credential.status
    if credential.expires_at and credential.expires_at < datetime.utcnow():
        status = CredentialStatus.EXPIRED.value

    return {
        "credential_id": credential.id,
        "did": credential.did,
        "status": status,
        "expires_at": credential.expires_at.isoformat() if credential.expires_at else None,
    }
