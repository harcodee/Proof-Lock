import uuid
import re
from datetime import datetime
from sqlalchemy.orm import Session

from models import User, Proof


def generate_proof(user_id: int, condition: str, db: Session) -> dict:
    """
    Simulates a Zero-Knowledge Proof for a given condition.
    The actual user data is evaluated server-side and NEVER returned.
    Returns: { proof_id, statement, result, data_revealed, generated_at }
    """
    # Parse condition — supported: "age > 18", "age >= 21", "age < 60", "age == 25"
    pattern = r"(\w+)\s*(>=|<=|>|<|==)\s*(\d+)"
    match = re.match(pattern, condition.strip())

    if not match:
        raise ValueError(
            "Invalid condition format. Use formats like: 'age > 18', 'age >= 21', 'age < 60'"
        )

    attribute, operator, threshold_str = match.groups()
    threshold = int(threshold_str)

    # Fetch user from DB — actual values are NEVER returned to client
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User with id {user_id} not found")

    if attribute == "age":
        actual_value = user.age
    else:
        raise ValueError(f"Attribute '{attribute}' not supported. Only 'age' is supported.")

    # Evaluate condition internally — ZKP simulation
    ops = {
        ">": actual_value > threshold,
        ">=": actual_value >= threshold,
        "<": actual_value < threshold,
        "<=": actual_value <= threshold,
        "==": actual_value == threshold,
    }
    result = ops[operator]

    proof_id = str(uuid.uuid4())

    # Save proof record to DB
    proof = Proof(
        user_id=user_id,
        condition=condition.strip(),
        result=result,
        proof_id=proof_id,
        created_at=datetime.utcnow(),
    )
    db.add(proof)
    db.commit()
    db.refresh(proof)

    # Return proof — actual value is NEVER included in response
    return {
        "proof_id": proof_id,
        "statement": condition.strip(),
        "result": result,
        "data_revealed": False,
        "attribute_checked": attribute,
        "actual_value_shared": None,  # explicitly null — ZKP guarantee
        "generated_at": datetime.utcnow().isoformat(),
    }
