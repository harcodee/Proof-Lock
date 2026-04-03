from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    id_number = Column(String, nullable=False, unique=True)
    image_path = Column(String, nullable=True)
    fraud_score = Column(String, nullable=True)  # LOW / MEDIUM / HIGH
    created_at = Column(DateTime, default=datetime.utcnow)

    credentials = relationship("Credential", back_populates="user")
    proofs = relationship("Proof", back_populates="user")


class Credential(Base):
    __tablename__ = "credentials"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    data = Column(Text, nullable=False)        # JSON string
    signature = Column(String, nullable=False)  # SHA256 hash
    issued_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="credentials")


class Proof(Base):
    __tablename__ = "proofs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    condition = Column(String, nullable=False)   # e.g. "age > 18"
    result = Column(Boolean, nullable=False)
    proof_id = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="proofs")
