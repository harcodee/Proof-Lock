"""
Revocation Service — invalidate credential, propagate status, log reason.
"""
from datetime import datetime
from sqlalchemy.orm import Session

from models import Credential, CredentialStatus
from services.audit_service import log_event


def revoke_credential(
    credential_id: int,
    reason: str,
    actor: str,
    db: Session,
) -> dict:
    """
    Revokes a credential by ID with a reason.
    Logs the revocation event in the audit trail.
    """
    credential = db.query(Credential).filter(Credential.id == credential_id).first()
    if not credential:
        raise ValueError(f"Credential {credential_id} not found")

    if credential.status == CredentialStatus.REVOKED.value:
        raise ValueError(f"Credential {credential_id} is already revoked")

    # Update status
    credential.status = CredentialStatus.REVOKED.value
    credential.revoked_reason = reason
    db.commit()

    # Log audit event
    log_event(
        actor=actor,
        action="credential_revoked",
        target_id=str(credential_id),
        detail=f"Reason: {reason}. DID: {credential.did}",
        db=db,
    )

    return {
        "credential_id": credential.id,
        "did": credential.did,
        "status": CredentialStatus.REVOKED.value,
        "reason": reason,
        "revoked_at": datetime.utcnow().isoformat(),
    }
