from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, Float, ForeignKey, JSON, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from database import Base


# ─── Enums ─────────────────────────────────────────────────────
class CredentialStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    REVOKED = "REVOKED"
    EXPIRED = "EXPIRED"


class TrustTier(str, enum.Enum):
    UNVERIFIED = "UNVERIFIED"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    VERIFIED = "VERIFIED"


# ─── Models ────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    id_number = Column(String, nullable=True, unique=True)
    username = Column(String, unique=True, index=True, nullable=True)
    email = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=True)
    image_path = Column(String, nullable=True)
    fraud_score = Column(String, nullable=True)  # LOW / MEDIUM / HIGH

    # v2 additions
    liveness_score = Column(Float, nullable=True, default=0.0)
    doc_verified = Column(Boolean, nullable=True, default=False)
    intake_hash = Column(String, nullable=True)
    version = Column(Integer, nullable=False, default=1)

    created_at = Column(DateTime, default=datetime.utcnow)

    credentials = relationship("Credential", back_populates="user")
    proofs = relationship("Proof", back_populates="user")
    trust_results = relationship("TrustResult", back_populates="user")


class Credential(Base):
    __tablename__ = "credentials"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    data = Column(Text, nullable=False)        # JSON string
    signature = Column(String, nullable=False)  # SHA256 hash
    issued_at = Column(DateTime, default=datetime.utcnow)

    # v2 additions
    did = Column(String, nullable=True, unique=True, index=True)
    status = Column(String, nullable=False, default=CredentialStatus.ACTIVE.value)
    expires_at = Column(DateTime, nullable=True)
    proof_token = Column(Text, nullable=True)
    revoked_reason = Column(String, nullable=True)
    version = Column(Integer, nullable=False, default=1)

    user = relationship("User", back_populates="credentials")


class Proof(Base):
    __tablename__ = "proofs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    condition = Column(String, nullable=False)   # e.g. "age > 18"
    result = Column(Boolean, nullable=False)
    proof_id = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # v2 additions
    claims = Column(JSON, nullable=True)           # structured claims
    disclosed_fields = Column(JSON, nullable=True)  # list of disclosed field names
    reusable = Column(Boolean, nullable=False, default=False)
    used_count = Column(Integer, nullable=False, default=0)
    max_uses = Column(Integer, nullable=True)
    expires_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="proofs")


class TrustResult(Base):
    __tablename__ = "trust_results"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    composite_score = Column(Float, nullable=False, default=0.0)
    tier = Column(String, nullable=False, default=TrustTier.UNVERIFIED.value)
    signals = Column(JSON, nullable=True)       # {face, liveness, doc, meta, behavior}
    flags = Column(JSON, nullable=True)         # ["liveness_failed", "exif_mismatch"]
    model_version = Column(String, nullable=False, default="v2.0")
    reviewed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="trust_results")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    actor = Column(String, nullable=False)          # user_id or "system"
    action = Column(String, nullable=False)         # e.g. "credential_issued"
    target_id = Column(String, nullable=True)       # credential_id, proof_id, etc.
    detail = Column(Text, nullable=True)            # JSON description
    prev_hash = Column(String, nullable=True)       # hash-chain link
    current_hash = Column(String, nullable=True)    # SHA-256 of this record
    ts = Column(DateTime, default=datetime.utcnow, index=True)


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    key_hash = Column(String, nullable=False, unique=True, index=True)
    owner = Column(String, nullable=False)
    scopes = Column(JSON, nullable=True, default=list)  # ["verify", "audit"]
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used = Column(DateTime, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
