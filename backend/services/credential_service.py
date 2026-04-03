import json
import hashlib
from datetime import datetime
from sqlalchemy.orm import Session

from models import User, Credential


def generate_credential(user_id: int, db: Session) -> dict:
    """
    Generates a Verifiable Identity Credential for a given user.
    Returns: { credential, signature, signature_short }
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User with id {user_id} not found")

    credential_data = {
        "user_id": user.id,
        "name": user.name,
        "age": user.age,
        "fraud_score": user.fraud_score,
        "verified": True,
        "issued_at": datetime.utcnow().isoformat(),
        "issuer": "DigitalIDPlatform/v1",
        "credential_type": "VerifiableIdentityCredential",
    }

    json_str = json.dumps(credential_data, sort_keys=True)
    signature = hashlib.sha256(json_str.encode()).hexdigest()

    # Save credential to DB
    credential = Credential(
        user_id=user_id,
        data=json_str,
        signature=signature,
        issued_at=datetime.utcnow(),
    )
    db.add(credential)
    db.commit()
    db.refresh(credential)

    return {
        "credential": credential_data,
        "signature": signature,
        "signature_short": signature[:16] + "...",
        "credential_id": credential.id,
    }


def get_credential(user_id: int, db: Session) -> dict:
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

    return {
        "credential": json.loads(credential.data),
        "signature": credential.signature,
        "signature_short": credential.signature[:16] + "...",
        "issued_at": credential.issued_at.isoformat(),
    }
