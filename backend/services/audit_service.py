"""
Audit Service — append-only event log (actor, action, timestamp, hash-chain).
Each event links to the previous via SHA-256 hash for tamper detection.
"""
import json
import hashlib
from datetime import datetime
from sqlalchemy.orm import Session

from models import AuditLog


def _compute_hash(actor: str, action: str, target_id: str, detail: str, prev_hash: str, ts: str) -> str:
    """Computes SHA-256 hash of the audit record for chain integrity."""
    payload = json.dumps({
        "actor": actor,
        "action": action,
        "target_id": target_id,
        "detail": detail,
        "prev_hash": prev_hash,
        "ts": ts,
    }, sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()


def log_event(
    actor: str,
    action: str,
    target_id: str = None,
    detail: str = None,
    db: Session = None,
) -> AuditLog:
    """
    Appends an event to the audit log with hash-chain integrity.
    """
    # Get the last log entry for prev_hash
    last = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
    prev_hash = last.current_hash if last else "genesis"

    ts = datetime.utcnow()
    ts_str = ts.isoformat()

    current_hash = _compute_hash(
        actor=actor,
        action=action,
        target_id=target_id or "",
        detail=detail or "",
        prev_hash=prev_hash,
        ts=ts_str,
    )

    entry = AuditLog(
        actor=actor,
        action=action,
        target_id=target_id,
        detail=detail,
        prev_hash=prev_hash,
        current_hash=current_hash,
        ts=ts,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_audit_trail(
    identity_id: int,
    db: Session,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    """
    Returns paginated audit trail for a given identity.
    """
    actor_str = str(identity_id)

    total = db.query(AuditLog).filter(
        (AuditLog.actor == actor_str) | (AuditLog.target_id == actor_str)
    ).count()

    entries = (
        db.query(AuditLog)
        .filter((AuditLog.actor == actor_str) | (AuditLog.target_id == actor_str))
        .order_by(AuditLog.ts.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    ACTION_ICONS = {
        "identity_registered": "👤",
        "credential_issued": "🔐",
        "credential_revoked": "🚫",
        "proof_generated": "🧮",
        "proof_verified": "✅",
        "trust_scored": "📊",
        "external_verify": "🌐",
    }

    return {
        "identity_id": identity_id,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
        "events": [
            {
                "id": e.id,
                "actor": e.actor,
                "action": e.action,
                "action_icon": ACTION_ICONS.get(e.action, "📌"),
                "target_id": e.target_id,
                "detail": e.detail,
                "hash": e.current_hash[:16] + "..." if e.current_hash else None,
                "ts": e.ts.isoformat() if e.ts else None,
            }
            for e in entries
        ],
    }
