"""
Intake Service — image validation, metadata extraction, dedup fingerprint.
"""
import hashlib
import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import UploadFile
from sqlalchemy.orm import Session

from models import User


UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


async def validate_and_ingest(
    image: Optional[UploadFile],
    video: Optional[UploadFile],
    db: Session,
) -> dict:
    """
    Validates the uploaded image, extracts metadata, and generates
    a dedup fingerprint (SHA-256 of file content).
    Returns: { image_path, intake_hash, metadata }
    """
    if not image and not video:
        return {"image_path": None, "video_path": None, "intake_hash": None, "metadata": {}}

    res_data = {"image_path": None, "video_path": None, "metadata": {}}
    content = None
    
    if image and image.filename:

    # Validate extension
        ext = os.path.splitext(image.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Unsupported image format: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    # Read content
        content = await image.read()

        # Validate file size
        if len(content) > MAX_FILE_SIZE:
            raise ValueError(f"Image too large. Max size: {MAX_FILE_SIZE // (1024 * 1024)} MB")

        # Generate dedup fingerprint
        intake_hash = hashlib.sha256(content).hexdigest()
        res_data["intake_hash"] = intake_hash
        
        # Check for duplicate uploads
        existing = db.query(User).filter(User.intake_hash == intake_hash).first()
        if existing:
            pass

        # Extract basic metadata
        metadata = {
            "original_filename": image.filename,
            "file_size_bytes": len(content),
            "content_type": image.content_type,
            "upload_timestamp": datetime.utcnow().isoformat(),
            "dedup_hash": intake_hash[:16] + "...",
        }

        # Try to extract EXIF metadata
        try:
            from PIL import Image
            from PIL.ExifTags import TAGS
            import io

            img = Image.open(io.BytesIO(content))
            metadata["image_width"] = img.width
            metadata["image_height"] = img.height
            metadata["image_format"] = img.format

            exif_data = img._getexif()
            if exif_data:
                for tag_id, value in exif_data.items():
                    tag = TAGS.get(tag_id, tag_id)
                    if tag in ("DateTime", "DateTimeOriginal", "Make", "Model", "Software"):
                        metadata[f"exif_{tag.lower()}"] = str(value)
        except Exception:
            pass

        # Save image to disk
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        filename = f"{uuid.uuid4()}{ext}"
        image_path = os.path.join(UPLOAD_DIR, filename)
        with open(image_path, "wb") as f:
            f.write(content)
            
        res_data["image_path"] = image_path
        res_data["metadata"] = metadata

    if video and video.filename:
        v_ext = os.path.splitext(video.filename)[1].lower()
        vid_content = await video.read()
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        v_filename = f"{uuid.uuid4()}{v_ext}"
        video_path = os.path.join(UPLOAD_DIR, v_filename)
        with open(video_path, "wb") as f:
            f.write(vid_content)
        res_data["video_path"] = video_path

    return res_data
