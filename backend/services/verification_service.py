from sqlalchemy.orm import Session
from models import Proof


def verify_proof(proof_id: str, db: Session) -> dict:
    """
    Verifies a given proof_id and returns access decision.
    Zero personal data is revealed in the response.
    """
    proof = db.query(Proof).filter(Proof.proof_id == proof_id).first()

    if not proof:
        return {
            "status": "ERROR",
            "message": "Proof not found. Please generate a valid proof first.",
            "proof_id": proof_id,
            "data_revealed": False,
        }

    if proof.result:
        return {
            "status": "ACCESS_GRANTED",
            "message": "Identity condition verified. Access approved.",
            "proof_id": proof_id,
            "statement": proof.condition,
            "data_revealed": False,
        }
    else:
        return {
            "status": "ACCESS_DENIED",
            "message": "Condition not met. Access denied.",
            "proof_id": proof_id,
            "statement": proof.condition,
            "data_revealed": False,
        }
