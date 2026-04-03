import os
import uuid
from fastapi import UploadFile
from sqlalchemy.orm import Session

from models import User
from services.fraud_service import analyze_fraud


UPLOAD_DIR = "uploads"


async def register_identity(
    name: str,
    age: int,
    id_number: str,
    image: UploadFile = None,
    db: Session = None,
):
    """
    Validates and registers a new user identity.
    Returns: { user_id, name, age, fraud_score }
    """
    # Validate inputs
    if not name or not name.strip():
        raise ValueError("Name cannot be empty")
    if age <= 0 or age > 120:
        raise ValueError("Age must be between 1 and 120")
    if not id_number or not id_number.strip():
        raise ValueError("ID number cannot be empty")

    # Ensure upload directory exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Process image upload
    image_path = None
    if image and image.filename:
        ext = os.path.splitext(image.filename)[1] or ".jpg"
        filename = f"{uuid.uuid4()}{ext}"
        image_path = os.path.join(UPLOAD_DIR, filename)
        content = await image.read()
        with open(image_path, "wb") as f:
            f.write(content)

    # Run fraud analysis
    fraud_score = analyze_fraud(image_path)

    # Create user record
    user = User(
        name=name.strip(),
        age=age,
        id_number=id_number.strip(),
        image_path=image_path,
        fraud_score=fraud_score,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "user_id": user.id,
        "name": user.name,
        "age": user.age,
        "fraud_score": user.fraud_score,
    }
