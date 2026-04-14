"""
Proof-Lock — Python AI Microservice
Runs on port 8001. Only handles biometric AI analysis.
Called internally by the Node.js backend. Not exposed to the frontend directly.

Accepts either:
  - Raw file uploads (image, video) — for local dev / fallback
  - Cloudinary URLs (image_url, video_url) — for Render deployment (cross-service)
"""
import os
import uuid
import shutil
import random
import tempfile
import urllib.request
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from ai_verification_service import analyze_all_signals
from trust_scoring_service import compute_trust_score

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="Proof-Lock AI Microservice",
    description="Internal AI biometric analysis service. Do NOT expose publicly.",
    version="1.0.0",
)

# Allow requests from Node.js backend (local and Render internal URLs)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Render internal traffic is safe; restrict if needed
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


def download_to_tmp(url: str, suffix: str = ".jpg") -> str:
    """Download a URL to a temporary local file. Returns the local path."""
    tmp_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}{suffix}")
    urllib.request.urlretrieve(url, tmp_path)
    return tmp_path


@app.get("/")
def root():
    return {
        "service": "Proof-Lock AI Microservice",
        "status": "online",
        "message": "This is an internal microservice. It does not serve frontend API routes. Please use the Node.js backend for the frontend API."
    }

@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-microservice"}


@app.post("/internal/analyze-biometrics")
async def analyze_biometrics(
    # Raw file uploads (local dev / fallback)
    image: Optional[UploadFile] = File(None),
    video: Optional[UploadFile] = File(None),
    # Cloudinary URLs (Render deployment)
    image_url: Optional[str] = Form(None),
    video_url: Optional[str] = Form(None),
    # Metadata
    image_width: Optional[int] = Form(None),
    image_height: Optional[int] = Form(None),
    file_size_bytes: Optional[int] = Form(None),
):
    """
    Main AI analysis endpoint. Called by Node.js backend only.
    Accepts image/video either as uploads or as Cloudinary URLs.
    Runs the full AI pipeline and returns a structured JSON.
    """
    image_path = None
    video_path = None
    metadata = {}
    tmp_files = []  # Track temp files to clean up

    try:
        # ── Resolve image ─────────────────────────────────────────────────────
        if image_url:
            # Download from Cloudinary URL
            try:
                ext = os.path.splitext(image_url.split("?")[0])[-1] or ".jpg"
                image_path = download_to_tmp(image_url, suffix=ext)
                tmp_files.append(image_path)
            except Exception as e:
                print(f"[ai] Failed to download image_url: {e}")

        elif image and image.filename:
            # Raw upload fallback
            ext = os.path.splitext(image.filename)[-1] or ".jpg"
            image_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}{ext}")
            with open(image_path, "wb") as f:
                shutil.copyfileobj(image.file, f)
            tmp_files.append(image_path)

        # Build metadata
        if image_path:
            if image_width:
                metadata["image_width"] = image_width
            if image_height:
                metadata["image_height"] = image_height
            if file_size_bytes:
                metadata["file_size_bytes"] = file_size_bytes

        # ── Resolve video ─────────────────────────────────────────────────────
        if video_url:
            try:
                video_path = download_to_tmp(video_url, suffix=".webm")
                tmp_files.append(video_path)
            except Exception as e:
                print(f"[ai] Failed to download video_url: {e}")

        elif video and video.filename:
            video_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}.webm")
            with open(video_path, "wb") as f:
                shutil.copyfileobj(video.file, f)
            tmp_files.append(video_path)

        # ── Run AI pipeline ───────────────────────────────────────────────────
        signals = analyze_all_signals(image_path, video_path, metadata)
        trust_data = compute_trust_score(signals)

        tier_to_fraud = {
            "VERIFIED": "LOW",
            "HIGH": "LOW",
            "MEDIUM": "MEDIUM",
            "LOW": "HIGH",
            "UNVERIFIED": "HIGH",
        }
        fraud_score = tier_to_fraud.get(trust_data["tier"], "MEDIUM")

        return {
            "success": True,
            "fraud_score": fraud_score,
            "liveness_score": signals.get("liveness", {}).get("score", 0.0),
            "doc_verified": signals.get("doc", {}).get("score", 0.0) > 0.5,
            # Return the Cloudinary URL (or local path) back to Node
            "image_path": image_url or image_path,
            "trust": {
                "composite_score": trust_data["composite_score"],
                "composite_pct": trust_data["composite_pct"],
                "tier": trust_data["tier"],
                "tier_label": trust_data["tier_label"],
                "signals": trust_data["signals"],
                "flags": trust_data["flags"],
                "model_version": trust_data["model_version"],
            },
        }

    except Exception as e:
        return {
            "success": False,
            "fraud_score": "MEDIUM",
            "liveness_score": random.uniform(0.4, 0.7),
            "doc_verified": False,
            "image_path": image_url or image_path,
            "trust": {
                "composite_score": 0.5,
                "composite_pct": 50,
                "tier": "MEDIUM",
                "tier_label": "Medium Trust",
                "signals": {},
                "flags": ["ai_pipeline_error"],
                "model_version": "v2.0",
            },
            "error": str(e),
        }

    finally:
        # Clean up any temp files downloaded from URLs
        for tmp in tmp_files:
            if tmp and os.path.exists(tmp):
                try:
                    os.remove(tmp)
                except Exception:
                    pass
